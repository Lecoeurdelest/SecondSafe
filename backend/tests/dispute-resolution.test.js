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

const Dispute = require('../src/modules/reports/dispute.model');
const Order = require('../src/modules/orders/order.model');
const Product = require('../src/modules/products/product.model');
const User = require('../src/modules/users/user.model');
const EscrowHold = require('../src/modules/payments/escrow-hold.model');
const escrowService = require('../src/modules/payments/escrow.service');
const { createNotification } = require('../src/modules/notifications/notification.service');
const { applySellingRestrictionToUser } = require('../src/common/utils/seller-restriction.util');
const business = require('../src/config/business');
const moderatorService = require('../src/modules/moderator/moderator.service');

const buyerId = '507f1f77bcf86cd799439011';
const sellerId = '507f1f77bcf86cd799439012';
const orderId = '507f1f77bcf86cd799439013';
const moderatorId = '507f1f77bcf86cd799439014';

function chain(value) {
  const query = { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['populate', 'sort', 'skip', 'limit']) query[method] = jest.fn(() => query);
  return query;
}

function storedDispute(overrides = {}) {
  return { _id: 'dispute', orderId, status: 'investigating', buyerId, sellerId, reason: 'damaged', save: jest.fn(), ...overrides };
}

function settle(dispute, resolution, moderatorNotes = 'Đã xem xét bằng chứng') {
  Dispute.findById.mockReset();
  Dispute.findById.mockReturnValueOnce(dispute).mockReturnValue(chain(dispute));
  return moderatorService.resolveDispute('dispute', moderatorId, { resolution, moderatorNotes });
}

beforeEach(() => {
  jest.resetAllMocks();
  EscrowHold.findOne.mockResolvedValue({ status: 'held' });
  User.findById.mockResolvedValue({ _id: sellerId, role: 'user', violationCount: 0, save: jest.fn() });
});

test('a moderator starts the investigation, both parties are told, and a resolved dispute cannot be reopened (AC-MOD-06-1)', async () => {
  const dispute = storedDispute({ status: 'pending' });
  Dispute.findById.mockReturnValueOnce(dispute).mockReturnValue(chain(dispute));

  await moderatorService.markDisputeInvestigating('dispute', moderatorId, ' Đang kiểm tra ');

  expect(dispute).toMatchObject({ status: 'investigating', moderatorId, moderatorNotes: 'Đang kiểm tra' });
  expect(createNotification).toHaveBeenCalledWith(buyerId, expect.objectContaining({ type: 'dispute_update' }));
  expect(createNotification).toHaveBeenCalledWith(sellerId, expect.objectContaining({ type: 'dispute_update' }));

  Dispute.findById.mockReset();
  Dispute.findById.mockReturnValue(storedDispute({ status: 'resolved' }));
  await expect(moderatorService.markDisputeInvestigating('dispute', moderatorId)).rejects.toThrow(/đã được xử lý/);
});

test('a moderator posts in the dispute conversation (AC-MOD-06-1)', async () => {
  const dispute = storedDispute({ disputeConversation: [], moderatorUpdates: [] });
  Dispute.findById.mockReturnValueOnce(dispute).mockReturnValue(chain(dispute));

  const result = await moderatorService.sendDisputeModeratorMessage('dispute', moderatorId, ' Hai bên bổ sung bằng chứng ');

  expect(dispute.disputeConversation.at(-1)).toMatchObject({ senderRole: 'moderator', senderId: moderatorId, content: 'Hai bên bổ sung bằng chứng' });
  expect(result.message.content).toBe('Hai bên bổ sung bằng chứng');
  expect(createNotification).toHaveBeenCalledTimes(2);
  Dispute.findById.mockReset();
  Dispute.findById.mockReturnValue(storedDispute());
  await expect(moderatorService.sendDisputeModeratorMessage('dispute', moderatorId, '   ')).rejects.toThrow('Nội dung tin nhắn không được để trống');
});

test('the default queue pages pending, then investigating, then resolved disputes', async () => {
  Dispute.countDocuments.mockImplementation(async filter => ({ pending: 1, investigating: 1, resolved: 3 }[filter.status] ?? 5));
  Dispute.find.mockImplementation(filter => chain([{ _id: `${filter.status}-item` }]));

  const result = await moderatorService.getDisputes({}, { page: 1, limit: 3 });

  expect(result.disputes.map(item => item._id)).toEqual(['pending-item', 'investigating-item', 'resolved-item']);
  expect(result.pagination).toMatchObject({ total: 5, totalPages: 2 });
});

test('only refund or release settle a dispute, and only after investigation (AC-MOD-06-1, AC-MOD-06-2)', async () => {
  await expect(settle(storedDispute(), 'split')).rejects.toThrow('Hướng xử lý khiếu nại không hợp lệ');
  await expect(settle(storedDispute({ status: 'pending' }), 'refund')).rejects.toThrow(/điều tra trước khi xử lý/);
  await expect(settle(storedDispute({ status: 'resolved' }), 'refund')).rejects.toThrow('Khiếu nại đã được xử lý trước đó');
  EscrowHold.findOne.mockResolvedValue(null);
  await expect(settle(storedDispute(), 'refund')).rejects.toThrow('Không tìm thấy tiền ký quỹ cho đơn hàng này');
  expect(escrowService.refundFunds).not.toHaveBeenCalled();
  expect(escrowService.releaseFunds).not.toHaveBeenCalled();
});

test('refund returns the escrow hold to the buyer and records a violation for the seller (AC-MOD-06-2, AC-MOD-06-3)', async () => {
  const seller = { _id: sellerId, role: 'user', violationCount: 0, save: jest.fn() };
  User.findById.mockResolvedValue(seller);
  const dispute = storedDispute();

  await settle(dispute, 'refund', 'Hàng lỗi');

  expect(escrowService.refundFunds).toHaveBeenCalledWith(orderId, expect.any(String));
  expect(User.findById).toHaveBeenCalledWith(sellerId);
  expect(seller.violationCount).toBe(1);
  expect(dispute).toMatchObject({ status: 'resolved', resolution: 'refund', moderatorNotes: 'Hàng lỗi', moderatorId });
  expect(dispute.resolvedAt).toBeInstanceOf(Date);
});

test('release pays the seller, completes the order, marks the listing sold and records a violation for the buyer (AC-MOD-06-2)', async () => {
  const order = { _id: orderId, status: 'disputed', productId: 'product', save: jest.fn() };
  Order.findById.mockResolvedValue(order);

  await settle(storedDispute(), 'release');

  expect(escrowService.releaseFunds).toHaveBeenCalledWith(orderId, expect.any(String), false);
  expect(order).toMatchObject({ status: 'completed', paymentStatus: 'paid' });
  expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('product', { status: 'sold' });
  expect(User.findById).toHaveBeenCalledWith(buyerId);
});

test('money already moved the other way cannot be moved again', async () => {
  EscrowHold.findOne.mockResolvedValue({ status: 'released' });
  await expect(settle(storedDispute(), 'refund')).rejects.toThrow(/không thể hoàn tiền/);
  EscrowHold.findOne.mockResolvedValue({ status: 'refunded' });
  await expect(settle(storedDispute(), 'release')).rejects.toThrow(/không thể nhả lại/);
});

test('the third dispute violation applies the configured selling restriction, never to an admin (AC-MOD-06-3, INV-04)', async () => {
  const seller = { _id: sellerId, role: 'user', violationCount: business.disputeRestrictionThreshold - 1, save: jest.fn() };
  User.findById.mockResolvedValue(seller);
  await settle(storedDispute(), 'refund');
  expect(seller.violationCount).toBe(business.disputeRestrictionThreshold);
  expect(applySellingRestrictionToUser).toHaveBeenCalledWith(seller, expect.objectContaining({
    durationMs: business.disputeRestrictionDurationMs, source: 'dispute_violation'
  }));

  applySellingRestrictionToUser.mockClear();
  const admin = { _id: sellerId, role: 'admin', violationCount: 5, save: jest.fn() };
  User.findById.mockResolvedValue(admin);
  await settle(storedDispute(), 'refund');
  expect(admin.violationCount).toBe(5);
  expect(applySellingRestrictionToUser).not.toHaveBeenCalled();
});
