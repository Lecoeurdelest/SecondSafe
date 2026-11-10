jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return Object.assign(Object.create(actual), { startSession: jest.fn() });
});
jest.mock('../src/modules/reports/report.model', () => ({}));
jest.mock('../src/modules/reports/dispute.model', () => ({ findById: jest.fn(), findOne: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), create: jest.fn() }));
jest.mock('../src/modules/orders/order.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({}));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/common/utils/seller-restriction.util', () => ({ applySellingRestrictionToUser: jest.fn() }));

const mongoose = require('mongoose');
const Dispute = require('../src/modules/reports/dispute.model');
const Order = require('../src/modules/orders/order.model');
const User = require('../src/modules/users/user.model');
const { createNotification } = require('../src/modules/notifications/notification.service');
const reportService = require('../src/modules/reports/report.service');

const buyerId = '507f1f77bcf86cd799439011';
const sellerId = '507f1f77bcf86cd799439012';
const strangerId = '507f1f77bcf86cd799439013';
const orderId = '507f1f77bcf86cd799439014';
const moderatorId = '507f1f77bcf86cd799439015';
const description = 'Sản phẩm bị rách nhiều trang';
const evidence = '/uploads/evidence/temp/1-abc.png';

let session;

function inSession(value) {
  return { session: jest.fn(active => { expect(active).toBe(session); return Promise.resolve(value); }) };
}

function chain(value) {
  const query = { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['populate', 'sort', 'skip', 'limit']) query[method] = jest.fn(() => query);
  return query;
}

function shippedOrder(overrides = {}) {
  return { _id: orderId, buyerId, sellerId, productId: 'product', status: 'shipped', save: jest.fn(), ...overrides };
}

function storedDispute(overrides = {}) {
  return { _id: 'dispute', buyerId, sellerId, status: 'investigating', reason: 'damaged', disputeConversation: [], save: jest.fn(), populate: jest.fn(), ...overrides };
}

beforeEach(() => {
  jest.resetAllMocks();
  session = { withTransaction: jest.fn(async work => work()), endSession: jest.fn() };
  mongoose.startSession.mockResolvedValue(session);
  Dispute.findOne.mockReturnValue(inSession(null));
  Dispute.create.mockImplementation(async ([fields]) => [storedDispute({ ...fields })]);
});

test('the buyer of a shipped order opens a dispute and the order becomes disputed in the same transaction (AC-DSP-01-1, AC-DSP-01-2)', async () => {
  const order = shippedOrder();
  Order.findById.mockReturnValue(inSession(order));

  const dispute = await reportService.createDispute(buyerId, orderId, 'damaged', description, [evidence]);

  expect(session.withTransaction).toHaveBeenCalledTimes(1);
  expect(Dispute.create).toHaveBeenCalledWith([expect.objectContaining({
    orderId, buyerId, sellerId, reason: 'damaged', description, evidenceImages: [evidence], status: 'pending'
  })], { session });
  expect(order.status).toBe('disputed');
  expect(order.save).toHaveBeenCalledWith({ session });
  expect(dispute.disputeConversation[0]).toMatchObject({ senderRole: 'buyer', content: description, evidenceFiles: [evidence] });
  expect(session.endSession).toHaveBeenCalled();
});

test('a failure while opening a dispute leaves the order untouched and ends the session', async () => {
  const order = shippedOrder();
  Order.findById.mockReturnValue(inSession(order));
  Dispute.create.mockRejectedValue(new Error('write failed'));

  await expect(reportService.createDispute(buyerId, orderId, 'damaged', description, [evidence])).rejects.toThrow('write failed');
  expect(order.save).not.toHaveBeenCalled();
  expect(session.endSession).toHaveBeenCalled();
});

test.each([
  ['someone other than the buyer', () => Order.findById.mockReturnValue(inSession(shippedOrder({ buyerId: strangerId }))), 'Bạn không phải người mua của đơn hàng này'],
  ['an order that is only paid', () => Order.findById.mockReturnValue(inSession(shippedOrder({ status: 'paid' }))), 'Chỉ có thể khiếu nại đơn hàng đang giao hoặc đã giao đến nơi'],
  ['an order that already has a dispute', () => { Order.findById.mockReturnValue(inSession(shippedOrder())); Dispute.findOne.mockReturnValue(inSession({ _id: 'existing' })); }, 'Đơn hàng này đã có khiếu nại rồi'],
  ['a missing order', () => Order.findById.mockReturnValue(inSession(null)), 'Đơn hàng không tồn tại']
])('a dispute from %s is refused (AC-DSP-01-1)', async (name, arrange, message) => {
  arrange();
  await expect(reportService.createDispute(buyerId, orderId, 'damaged', description, [evidence])).rejects.toThrow(message);
  expect(Dispute.create).not.toHaveBeenCalled();
});

test.each([
  ['no evidence', ['damaged', description, []]],
  ['a description under 10 characters', ['damaged', 'ngắn', [evidence]]],
  ['a description over 1000 characters', ['damaged', 'a'.repeat(1001), [evidence]]],
  ['no reason', ['', description, [evidence]]],
  ['evidence that was not uploaded here', ['damaged', description, ['https://evil.example/x.png']]]
])('a dispute with %s is rejected before any transaction starts', async (name, [reason, text, files]) => {
  await expect(reportService.createDispute(buyerId, orderId, reason, text, files)).rejects.toThrow();
  expect(mongoose.startSession).not.toHaveBeenCalled();
});

test('a delivered order can also be disputed', async () => {
  const order = shippedOrder({ status: 'delivered' });
  Order.findById.mockReturnValue(inSession(order));
  await reportService.createDispute(buyerId, orderId, 'not_as_described', description, [evidence]);
  expect(order.status).toBe('disputed');
});

test('the seller responds with evidence only while the dispute is investigating (AC-DSP-02-1)', async () => {
  for (const status of ['pending', 'resolved']) {
    Dispute.findById.mockResolvedValue(storedDispute({ status }));
    await expect(reportService.addSellerResponse('dispute', sellerId, 'Tôi đã gửi đúng hàng')).rejects.toThrow();
  }
  Dispute.findById.mockResolvedValue(storedDispute());
  await expect(reportService.addSellerResponse('dispute', buyerId, 'Tôi đã gửi đúng hàng')).rejects.toThrow('Bạn không phải người bán của đơn hàng này');

  const dispute = storedDispute();
  Dispute.findById.mockResolvedValue(dispute);
  await reportService.addSellerResponse('dispute', sellerId, ' Tôi đã gửi đúng hàng ', [evidence]);
  expect(dispute).toMatchObject({ sellerResponse: 'Tôi đã gửi đúng hàng', sellerEvidenceImages: [evidence] });
  expect(dispute.disputeConversation.at(-1)).toMatchObject({ senderRole: 'seller', evidenceFiles: [evidence] });
  expect(dispute.save).toHaveBeenCalled();
});

test('the buyer adds a note or a file only while the dispute is investigating (AC-DSP-03-1)', async () => {
  await expect(reportService.addBuyerFollowUp('dispute', buyerId, '  ', [])).rejects.toThrow('Vui lòng nhập ghi chú hoặc tải lên ít nhất 1 tệp bằng chứng');

  Dispute.findById.mockResolvedValue(storedDispute({ status: 'pending' }));
  await expect(reportService.addBuyerFollowUp('dispute', buyerId, 'Bổ sung')).rejects.toThrow(/chưa bắt đầu điều tra/);

  const dispute = storedDispute({ moderatorId });
  Dispute.findById.mockResolvedValueOnce(dispute).mockReturnValue(chain({ ...dispute, buyerId: { _id: buyerId }, sellerId: { _id: sellerId } }));
  User.findById.mockResolvedValue({ role: 'user' });
  await reportService.addBuyerFollowUp('dispute', buyerId, '', [evidence]);

  expect(dispute.buyerAdditionalEvidenceImages).toEqual([evidence]);
  expect(dispute.disputeConversation.at(-1)).toMatchObject({ senderRole: 'buyer', content: 'Người mua gửi bổ sung bằng chứng' });
  expect(createNotification).toHaveBeenCalledWith(moderatorId, expect.objectContaining({ type: 'dispute_update' }));
});

test('return confirmation applies once to return requests under investigation (AC-DSP-04-1)', async () => {
  Dispute.findById.mockResolvedValue(storedDispute({ reason: 'damaged' }));
  await expect(reportService.confirmSellerReturn('dispute', sellerId)).rejects.toThrow('Chỉ áp dụng cho yêu cầu hoàn hàng');
  Dispute.findById.mockResolvedValue(storedDispute({ reason: 'return_request', status: 'pending' }));
  await expect(reportService.confirmSellerReturn('dispute', sellerId)).rejects.toThrow(/điều tra/);
  Dispute.findById.mockResolvedValue(storedDispute({ reason: 'return_request' }));
  await expect(reportService.confirmSellerReturn('dispute', buyerId)).rejects.toThrow('Bạn không phải người bán của đơn hàng này');

  const dispute = storedDispute({ reason: 'return_request' });
  Dispute.findById.mockResolvedValue(dispute);
  await reportService.confirmSellerReturn('dispute', sellerId);
  expect(dispute.sellerConfirmedReturnAt).toBeInstanceOf(Date);
  await expect(reportService.confirmSellerReturn('dispute', sellerId)).rejects.toThrow('Đã xác nhận nhận lại hàng trước đó');
});

test('dispute lists cover the caller as buyer or seller, and detail is limited to parties and staff (AC-DSP-05-1)', async () => {
  Dispute.find.mockReturnValue(chain([{ _id: 'dispute' }]));
  Dispute.countDocuments.mockResolvedValue(1);
  await reportService.getUserDisputes(sellerId, {});
  expect(Dispute.find).toHaveBeenCalledWith({ $or: [{ buyerId: sellerId }, { sellerId }] });

  const populated = { _id: 'dispute', buyerId: { _id: buyerId }, sellerId: { _id: sellerId } };
  Dispute.findById.mockReturnValue(chain(populated));
  User.findById.mockResolvedValue({ role: 'user' });
  await expect(reportService.getDisputeById('dispute', buyerId)).resolves.toBe(populated);
  await expect(reportService.getDisputeById('dispute', sellerId)).resolves.toBe(populated);
  await expect(reportService.getDisputeById('dispute', strangerId)).rejects.toThrow('Bạn không có quyền xem khiếu nại này');
  User.findById.mockResolvedValue({ role: 'moderator' });
  await expect(reportService.getDisputeById('dispute', strangerId)).resolves.toBe(populated);
});
