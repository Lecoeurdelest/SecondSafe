jest.mock('../src/modules/reports/report.model', () => ({ findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() }));
jest.mock('../src/modules/reports/dispute.model', () => ({ findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/reports/review.model', () => ({ findById: jest.fn(), find: jest.fn(), updateMany: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/orders/order.model', () => ({ findById: jest.fn(), find: jest.fn(), aggregate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ findById: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn(), find: jest.fn() }));
jest.mock('../src/modules/payments/escrow-hold.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/payments/transaction.model', () => ({ find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/payments/escrow.service', () => ({ releaseFunds: jest.fn(), refundFunds: jest.fn() }));
jest.mock('../src/modules/orders/order.service', () => ({ forceCancelOrder: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/common/utils/seller-restriction.util', () => ({ applySellingRestrictionToUser: jest.fn() }));

const Report = require('../src/modules/reports/report.model');
const Product = require('../src/modules/products/product.model');
const User = require('../src/modules/users/user.model');
const { createNotification } = require('../src/modules/notifications/notification.service');
const { applySellingRestrictionToUser } = require('../src/common/utils/seller-restriction.util');
const business = require('../src/config/business');
const reportService = require('../src/modules/reports/report.service');
const moderatorService = require('../src/modules/moderator/moderator.service');

const reporterId = '507f1f77bcf86cd799439011';
const sellerId = '507f1f77bcf86cd799439012';
const moderatorId = '507f1f77bcf86cd799439013';
const productId = '507f1f77bcf86cd799439014';

function pendingReport(overrides = {}) {
  return { _id: 'report', status: 'pending', reportType: 'product', productId, reporterId, reportedUserId: sellerId, save: jest.fn(), ...overrides };
}

function storedUser(overrides = {}) {
  return { _id: sellerId, role: 'user', violationCount: 0, save: jest.fn(), ...overrides };
}

function storedProduct(status = 'active') {
  return { _id: productId, status, save: jest.fn() };
}

function resolve(report, decision, extra = {}) {
  Report.findById.mockResolvedValue(report);
  return reportService.resolveReport('report', moderatorId, extra.status || 'resolved', decision, extra.notes || 'Ghi chú', extra.reply ?? 'Đã xử lý', extra.replyToReportedUser ?? '');
}

beforeEach(() => {
  jest.resetAllMocks();
  Report.countDocuments.mockResolvedValue(0);
  User.findById.mockResolvedValue(storedUser());
  Product.findById.mockResolvedValue(storedProduct());
});

test('moderators list reports with literal keyword search and target statistics (AC-MOD-02-1)', async () => {
  const query = { lean: jest.fn().mockResolvedValue([]) };
  for (const method of ['sort', 'skip', 'limit', 'populate']) query[method] = jest.fn(() => query);
  Report.find.mockReturnValue(query);

  const result = await moderatorService.getReports({ status: 'pending', reportType: 'product', keyword: '(a+)+$' }, { page: 1, limit: 10 });

  const filter = Report.find.mock.calls[0][0];
  expect(filter).toMatchObject({ status: 'pending', reportType: 'product' });
  expect(filter.$or[0].reason.test('(a+)+$')).toBe(true);
  expect(filter.$or[0].reason.test('aaaa')).toBe(false);
  expect(result.pagination).toMatchObject({ page: 1, limit: 10, total: 0 });
});

test.each([
  ['an unknown status', 'warn_user', { status: 'closed' }, 'Trạng thái xử lý báo cáo không hợp lệ'],
  ['an unknown decision', 'delete_account', {}, 'Quyết định xử lý báo cáo không hợp lệ'],
  ['a dismissal that sanctions', 'warn_user', { status: 'dismissed' }, 'Khi bỏ qua báo cáo chỉ được dùng quyết định trả lời phản hồi'],
  ['feedback without any reply', 'reply_feedback', { reply: '', replyToReportedUser: ' ' }, /cần ít nhất 1 nội dung phản hồi/]
])('resolution with %s is refused (AC-MOD-02-2)', async (name, decision, extra, message) => {
  const report = pendingReport();
  await expect(resolve(report, decision, extra)).rejects.toThrow(message);
  expect(report.save).not.toHaveBeenCalled();
});

test('remove_content applies only to listing reports and a processed report cannot be resolved again (AC-MOD-02-2)', async () => {
  await expect(resolve(pendingReport({ reportType: 'user', productId: undefined }), 'remove_content')).rejects.toThrow('Quyết định gỡ nội dung chỉ áp dụng cho báo cáo sản phẩm');
  for (const status of ['resolved', 'dismissed']) {
    await expect(resolve(pendingReport({ status }), 'warn_user')).rejects.toThrow('Báo cáo này đã được xử lý trước đó rồi');
  }
});

test('remove_content removes the listing and both parties are notified (AC-MOD-02-3, AC-MOD-03-2)', async () => {
  const product = storedProduct();
  Product.findById.mockResolvedValue(product);
  const report = pendingReport();

  await resolve(report, 'remove_content', { reply: 'Tin đã bị gỡ', replyToReportedUser: 'Tin của bạn vi phạm' });

  expect(product.status).toBe('rejected');
  expect(report).toMatchObject({ status: 'resolved', moderatorDecision: 'remove_content', moderatorId });
  expect(report.resolvedAt).toBeInstanceOf(Date);
  expect(createNotification).toHaveBeenCalledWith(reporterId, expect.objectContaining({ type: 'report_update', message: 'Tin đã bị gỡ' }));
  expect(createNotification).toHaveBeenCalledWith(sellerId, expect.objectContaining({ type: 'report_update', message: 'Tin của bạn vi phạm' }));
});

test('a dismissal with feedback sanctions nobody', async () => {
  const report = pendingReport();
  await resolve(report, 'reply_feedback', { status: 'dismissed' });
  expect(report.status).toBe('dismissed');
  expect(User.findById).not.toHaveBeenCalled();
  expect(Product.findById).not.toHaveBeenCalled();
});

test.each([
  [0, null],
  [2, 0],
  [5, 1],
  [8, 2]
])('warn_user from %i earlier warnings counts the warning and restricts at 3, 6 and 9 (AC-MOD-03-1)', async (violationCount, durationIndex) => {
  const user = storedUser({ violationCount });
  User.findById.mockResolvedValue(user);

  await resolve(pendingReport({ reportType: 'user', productId: undefined }), 'warn_user');

  expect(user.violationCount).toBe(violationCount + 1);
  if (durationIndex === null) {
    expect(applySellingRestrictionToUser).not.toHaveBeenCalled();
    expect(user.save).toHaveBeenCalled();
  } else {
    expect(applySellingRestrictionToUser).toHaveBeenCalledWith(user, expect.objectContaining({
      durationMs: business.sanctionDurationsMs[durationIndex], source: 'report_warning'
    }));
  }
});

test('the third resolved warning against one listing removes it (AC-MOD-03-2)', async () => {
  const product = storedProduct();
  Product.findById.mockResolvedValue(product);
  Report.countDocuments.mockResolvedValue(1);
  await resolve(pendingReport(), 'warn_user');
  expect(product.status).toBe('active');

  Report.countDocuments.mockResolvedValue(2);
  await resolve(pendingReport(), 'warn_user');
  expect(Report.countDocuments).toHaveBeenLastCalledWith({ _id: { $ne: 'report' }, productId, status: 'resolved', moderatorDecision: 'warn_user' });
  expect(product.status).toBe('rejected');
});

test('ban_user restricts selling indefinitely, and admins are never sanctioned (AC-MOD-03-2, INV-04)', async () => {
  const user = storedUser();
  User.findById.mockResolvedValue(user);
  await resolve(pendingReport(), 'ban_user', { notes: 'Lừa đảo nhiều lần' });
  const restriction = applySellingRestrictionToUser.mock.calls[0][1];
  expect(restriction).toEqual({ reason: 'Lừa đảo nhiều lần', source: 'report_ban' });

  applySellingRestrictionToUser.mockClear();
  User.findById.mockResolvedValue(storedUser({ role: 'admin' }));
  const banned = pendingReport();
  await expect(resolve(banned, 'ban_user')).rejects.toThrow('Không thể khóa tài khoản admin');
  expect(banned.save).not.toHaveBeenCalled();

  const admin = storedUser({ role: 'admin', violationCount: 2 });
  User.findById.mockResolvedValue(admin);
  await resolve(pendingReport({ reportType: 'user', productId: undefined }), 'warn_user');
  expect(admin.violationCount).toBe(2);
  expect(applySellingRestrictionToUser).not.toHaveBeenCalled();
});

test('the moderator endpoint and the report endpoint resolve through one handler (AC-MOD-02-3)', async () => {
  const report = pendingReport();
  Report.findById.mockResolvedValue(report);

  await moderatorService.resolveReport('report', moderatorId, {
    status: 'dismissed', moderatorDecision: 'reply_feedback', moderatorNotes: '', moderatorReply: 'Không vi phạm', moderatorReplyToReportedUser: ''
  });

  expect(report).toMatchObject({ status: 'dismissed', moderatorDecision: 'reply_feedback', moderatorReply: 'Không vi phạm', moderatorId });
});

test('a moderator restricts a non-admin user with a reason and cannot sanction an admin (AC-MOD-07-1)', async () => {
  const user = storedUser({ violationCount: 1 });
  User.findById.mockResolvedValue(user);

  await moderatorService.banUser(sellerId, 'Bán hàng giả');

  expect(user.violationCount).toBe(2);
  expect(applySellingRestrictionToUser).toHaveBeenCalledWith(user, { reason: 'Bán hàng giả', source: 'moderator_ban' });

  User.findById.mockResolvedValue(storedUser({ role: 'admin' }));
  await expect(moderatorService.banUser(sellerId, 'x')).rejects.toThrow('Không thể khóa tài khoản admin');
  User.findById.mockResolvedValue(null);
  await expect(moderatorService.banUser(sellerId, 'x')).rejects.toThrow('Người dùng không tồn tại');
});
