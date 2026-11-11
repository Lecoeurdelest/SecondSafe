jest.mock('../src/modules/reports/report.model', () => ({ findById: jest.fn(), findOne: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), create: jest.fn() }));
jest.mock('../src/modules/reports/dispute.model', () => ({}));
jest.mock('../src/modules/orders/order.model', () => ({}));
jest.mock('../src/modules/products/product.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/common/utils/seller-restriction.util', () => ({ applySellingRestrictionToUser: jest.fn() }));

const Report = require('../src/modules/reports/report.model');
const Product = require('../src/modules/products/product.model');
const User = require('../src/modules/users/user.model');
const { applySellingRestrictionToUser } = require('../src/common/utils/seller-restriction.util');
const business = require('../src/config/business');
const reportService = require('../src/modules/reports/report.service');

const reporterId = '507f1f77bcf86cd799439011';
const sellerId = '507f1f77bcf86cd799439012';
const strangerId = '507f1f77bcf86cd799439013';
const productId = '507f1f77bcf86cd799439014';
const description = 'Tin đăng có dấu hiệu lừa đảo';
const evidence = '/uploads/evidence/temp/1-abc.png';

function chain(value) {
  const query = { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject), lean: jest.fn().mockResolvedValue(value) };
  for (const method of ['populate', 'sort', 'skip', 'limit']) query[method] = jest.fn(() => query);
  return query;
}

function storedReport(fields) {
  return { ...fields, populate: jest.fn(), toObject() { return { ...fields }; } };
}

beforeEach(() => {
  jest.resetAllMocks();
  Product.findById.mockResolvedValue({ _id: productId, seller: sellerId });
  Report.findOne.mockResolvedValue(null);
  Report.create.mockImplementation(async fields => storedReport(fields));
  Report.countDocuments.mockResolvedValue(1);
  User.findById.mockResolvedValue({ _id: sellerId, role: 'user', violationCount: 0 });
});

test('a listing report records the seller as the reported user (AC-RPT-01-1)', async () => {
  const report = await reportService.createProductReport(reporterId, productId, 'scam', `  ${description}  `, [evidence]);

  expect(Report.create).toHaveBeenCalledWith(expect.objectContaining({
    reporterId, reportedUserId: sellerId, productId, reportType: 'product', reason: 'scam', description, evidenceImages: [evidence], status: 'pending'
  }));
  expect(report.status).toBe('pending');
});

test.each([
  ['a missing reason', ['', description]],
  ['a description under 10 characters', ['scam', 'quá ngắn']],
  ['a blank description', ['scam', '   ']]
])('a report with %s is rejected', async (name, [reason, text]) => {
  await expect(reportService.createProductReport(reporterId, productId, reason, text)).rejects.toThrow();
  await expect(reportService.createUserReport(reporterId, sellerId, reason, text)).rejects.toThrow();
  expect(Report.create).not.toHaveBeenCalled();
});

test.each([
  [['https://evil.example/a.jpg']],
  [['/uploads/evidence/../../etc/passwd']],
  [Array(6).fill(evidence)],
  [evidence]
])('report evidence must be uploaded files: %j', async files => {
  await expect(reportService.createUserReport(reporterId, sellerId, 'scam', description, files)).rejects.toThrow(/bằng chứng/);
  expect(Report.create).not.toHaveBeenCalled();
});

test('a user cannot report their own listing or the same listing twice (AC-RPT-01-2)', async () => {
  await expect(reportService.createProductReport(sellerId, productId, 'scam', description)).rejects.toThrow('Bạn không thể báo cáo sản phẩm của chính mình');

  Report.findOne.mockResolvedValue({ _id: 'earlier', status: 'resolved' });
  await expect(reportService.createProductReport(reporterId, productId, 'scam', description)).rejects.toThrow('Bạn đã báo cáo sản phẩm này rồi');
  expect(Report.findOne).toHaveBeenCalledWith({ reporterId, productId });
  expect(Report.create).not.toHaveBeenCalled();
});

test('a user report targets an existing user other than the reporter (AC-RPT-02-1)', async () => {
  await expect(reportService.createUserReport(reporterId, reporterId, 'scam', description)).rejects.toThrow('Bạn không thể báo cáo chính mình');

  User.findById.mockResolvedValueOnce(null);
  await expect(reportService.createUserReport(reporterId, strangerId, 'scam', description)).rejects.toThrow('Người dùng không tồn tại');

  await reportService.createUserReport(reporterId, sellerId, 'spam', description);
  expect(Report.create).toHaveBeenCalledWith(expect.objectContaining({ reportType: 'user', reportedUserId: sellerId, reason: 'spam' }));
});

test('a reporter lists only their own reports with pagination (AC-RPT-03-1)', async () => {
  Report.find.mockReturnValue(chain([{ _id: 'r1' }]));
  Report.countDocuments.mockResolvedValue(21);

  const result = await reportService.getUserReports(reporterId, { page: 2, limit: 20 });

  expect(Report.find).toHaveBeenCalledWith({ reporterId });
  expect(result.pagination).toEqual({ page: 2, limit: 20, total: 21, totalPages: 2 });
});

test('report detail: full for the reporter and staff, redacted for the reported user, denied to others (AC-RPT-03-2)', async () => {
  const stored = storedReport({
    _id: 'report', reason: 'scam', description, evidenceImages: [evidence], moderatorNotes: 'nội bộ', moderatorReply: 'cho người báo cáo',
    moderatorReplyToReportedUser: 'cho người bị báo cáo', reporterId: { _id: reporterId, fullName: 'Người báo cáo' }, reportedUserId: { _id: sellerId }
  });
  Report.findById.mockReturnValue(chain(stored));

  expect(await reportService.getReportById('report', { userId: reporterId, role: 'user' })).toBe(stored);
  expect(await reportService.getReportById('report', { userId: strangerId, role: 'moderator' })).toBe(stored);
  expect(await reportService.getReportById('report', { userId: strangerId, role: 'admin' })).toBe(stored);

  const redacted = await reportService.getReportById('report', { userId: sellerId, role: 'user' });
  expect(redacted).toMatchObject({ reason: 'scam', moderatorReplyToReportedUser: 'cho người bị báo cáo' });
  for (const field of ['reporterId', 'evidenceImages', 'moderatorNotes', 'moderatorReply']) expect(redacted).not.toHaveProperty(field);

  await expect(reportService.getReportById('report', { userId: strangerId, role: 'user' })).rejects.toMatchObject({ statusCode: 403 });
});

test('reaching the configured number of open reports restricts the seller automatically (AC-RPT-04-1)', async () => {
  const seller = { _id: sellerId, role: 'user', violationCount: 0 };
  User.findById.mockResolvedValue(seller);
  Report.countDocuments.mockResolvedValue(business.reportRestrictionThreshold - 1);
  await reportService.createProductReport(reporterId, productId, 'scam', description);
  expect(applySellingRestrictionToUser).not.toHaveBeenCalled();

  Report.countDocuments.mockResolvedValue(business.reportRestrictionThreshold);
  await reportService.createProductReport(reporterId, productId, 'scam', description);
  expect(Report.countDocuments).toHaveBeenLastCalledWith({ reportedUserId: sellerId, status: { $ne: 'dismissed' } });
  expect(applySellingRestrictionToUser).toHaveBeenCalledWith(seller, expect.objectContaining({ source: 'report_threshold_auto' }));
});

test('an admin is never restricted by reports (INV-04)', async () => {
  User.findById.mockResolvedValue({ _id: sellerId, role: 'admin' });
  Report.countDocuments.mockResolvedValue(99);
  await reportService.createUserReport(reporterId, sellerId, 'scam', description);
  expect(applySellingRestrictionToUser).not.toHaveBeenCalled();
});
