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
jest.mock('../src/modules/reports/review.service', () => ({ updateUserRating: jest.fn() }));

const Order = require('../src/modules/orders/order.model');
const Review = require('../src/modules/reports/review.model');
const Product = require('../src/modules/products/product.model');
const User = require('../src/modules/users/user.model');
const EscrowHold = require('../src/modules/payments/escrow-hold.model');
const escrowService = require('../src/modules/payments/escrow.service');
const orderService = require('../src/modules/orders/order.service');
const reviewService = require('../src/modules/reports/review.service');
const { createNotification } = require('../src/modules/notifications/notification.service');
const { applySellingRestrictionToUser } = require('../src/common/utils/seller-restriction.util');
const business = require('../src/config/business');
const moderatorService = require('../src/modules/moderator/moderator.service');

const orderId = '507f1f77bcf86cd799439011';
const moderatorId = '507f1f77bcf86cd799439012';
const sellerId = '507f1f77bcf86cd799439013';

function chain(value) {
  const query = { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject), lean: jest.fn().mockResolvedValue(value) };
  for (const method of ['populate', 'sort', 'skip', 'limit']) query[method] = jest.fn(() => query);
  return query;
}

function storedOrder(status, extra = {}) {
  const order = { _id: orderId, status, save: jest.fn(), ...extra, toObject() { return { _id: orderId, status: this.status }; } };
  return order;
}

function storedReview(overrides = {}) {
  return { _id: 'review', reviewedUserId: sellerId, status: 'active', rating: 2, moderatorAssessment: { isReviewed: false, isBad: false }, save: jest.fn(), populate: jest.fn(), ...overrides };
}

function update(status, nextStatus, note) {
  Order.findById.mockReset();
  Order.findById.mockReturnValueOnce(storedOrder(status)).mockReturnValue(chain(storedOrder(nextStatus)));
  return moderatorService.updateOrderStatusByModerator(orderId, nextStatus, moderatorId, note);
}

beforeEach(() => jest.resetAllMocks());

test('moderators list orders by status with legacy statuses folded in, and open one with its allowed next steps (AC-MOD-04-1)', async () => {
  Order.find.mockReturnValue(chain([
    { _id: 'a', status: 'pending', confirmedBySeller: true, buyerId: { fullName: 'Người Mua' }, productId: { title: 'Sách' } },
    { _id: 'b', status: 'awaiting_payment', buyerId: { fullName: 'Khác' }, productId: { title: 'Đèn' } }
  ]));
  Order.countDocuments.mockResolvedValue(2);

  const list = await moderatorService.getOrders({ status: 'awaiting_payment', keyword: 'sách' }, { page: 1, limit: 10 });

  expect(Order.find).toHaveBeenCalledWith({ status: { $in: ['awaiting_payment', 'pending'] } });
  expect(list.orders).toEqual([expect.objectContaining({ _id: 'a', status: 'awaiting_payment' })]);
  expect(list.pagination).toMatchObject({ page: 1, limit: 10, total: 2 });

  Order.findById.mockReturnValue(chain(storedOrder('paid')));
  const detail = await moderatorService.getOrderById(orderId);
  expect(detail.allowedNextStatuses).toEqual(['shipped', 'disputed', 'cancelled']);
  Order.findById.mockReturnValue(chain(null));
  await expect(moderatorService.getOrderById(orderId)).rejects.toThrow('Đơn hàng không tồn tại');
});

test.each([
  ['completed', 'shipped'],
  ['cancelled', 'paid'],
  ['awaiting_payment', 'completed'],
  ['paid', 'completed'],
  ['shipped', 'paid']
])('a correction from %s to %s is outside the transition matrix (AC-MOD-04-2, INV-07)', async (status, nextStatus) => {
  await expect(update(status, nextStatus)).rejects.toThrow(/Không thể chuyển/);
  expect(escrowService.releaseFunds).not.toHaveBeenCalled();
  expect(orderService.forceCancelOrder).not.toHaveBeenCalled();
});

test('a cancellation needs a note of at least ten characters and goes through the refunding cancel flow (AC-MOD-04-2, INV-01)', async () => {
  await expect(update('paid', 'cancelled', 'ngắn')).rejects.toThrow(/ít nhất 10 ký tự/);
  expect(orderService.forceCancelOrder).not.toHaveBeenCalled();

  await update('paid', 'cancelled', 'Người bán không phản hồi');
  expect(orderService.forceCancelOrder).toHaveBeenCalledWith(orderId, moderatorId, 'Người bán không phản hồi');
});

test('a completion releases escrow, completes the order and marks the listing sold; it refuses when nothing is held (AC-MOD-04-2, INV-01)', async () => {
  EscrowHold.findOne.mockResolvedValue({ status: 'held' });
  const released = storedOrder('shipped', { productId: 'product' });
  Order.findById.mockReturnValueOnce(storedOrder('shipped')).mockReturnValueOnce(released).mockReturnValue(chain(storedOrder('completed')));

  await moderatorService.updateOrderStatusByModerator(orderId, 'completed', moderatorId);

  expect(escrowService.releaseFunds).toHaveBeenCalledWith(orderId, expect.any(String), false);
  expect(released).toMatchObject({ status: 'completed', paymentStatus: 'paid' });
  expect(released.completedAt).toBeInstanceOf(Date);
  expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('product', { status: 'sold' });

  EscrowHold.findOne.mockResolvedValue({ status: 'refunded' });
  await expect(update('shipped', 'completed')).rejects.toThrow(/ký quỹ/);
  EscrowHold.findOne.mockResolvedValue(null);
  await expect(update('disputed', 'completed')).rejects.toThrow(/ký quỹ/);
});

test('marking a paid order shipped records the shipping time without touching money', async () => {
  const order = storedOrder('paid');
  Order.findById.mockReturnValueOnce(order).mockReturnValue(chain(storedOrder('shipped')));
  await moderatorService.updateOrderStatusByModerator(orderId, 'shipped', moderatorId);
  expect(order.status).toBe('shipped');
  expect(order.shippedAt).toBeInstanceOf(Date);
  expect(order.save).toHaveBeenCalled();
  expect(escrowService.releaseFunds).not.toHaveBeenCalled();
});

test('force-cancel delegates to the order service, which refuses completed orders (AC-MOD-04-2)', async () => {
  orderService.forceCancelOrder.mockRejectedValue(new Error('Không thể hủy đơn hàng đã hoàn thành'));
  await expect(moderatorService.forceCancelOrder(orderId, moderatorId, 'Lý do đủ dài')).rejects.toThrow('Không thể hủy đơn hàng đã hoàn thành');
  expect(orderService.forceCancelOrder).toHaveBeenCalledWith(orderId, moderatorId, 'Lý do đủ dài');
});

test('hiding a review recalculates the seller rating and cannot be repeated (AC-MOD-05-1, AC-REV-05-1)', async () => {
  const review = storedReview();
  Review.findById.mockResolvedValue(review);
  await moderatorService.hideReview('review');
  expect(review.status).toBe('hidden');
  expect(reviewService.updateUserRating).toHaveBeenCalledWith(sellerId);

  await expect(moderatorService.hideReview('review')).rejects.toThrow('Đánh giá đã bị ẩn trước đó');
});

test('a review is judged good or bad once (AC-MOD-05-1)', async () => {
  const review = storedReview();
  Review.findById.mockResolvedValue(review);
  await moderatorService.markSellerGoodByReview('review', moderatorId, 'Hợp lệ');
  expect(review.moderatorAssessment).toMatchObject({ isReviewed: true, isBad: false, verdict: 'good', moderatorId });

  await expect(moderatorService.markSellerGoodByReview('review', moderatorId)).rejects.toThrow('Đánh giá này đã được moderator xử lý trước đó');
  await expect(moderatorService.markSellerBadByReview('review', moderatorId, 'Ghi chú đủ dài')).rejects.toThrow('Đánh giá này đã được moderator xử lý trước đó');
});

test('reviews of four stars or more are approved automatically before the queue is read (AC-MOD-05-1)', async () => {
  Review.find.mockReturnValue(chain([]));
  Review.countDocuments.mockResolvedValue(0);
  await moderatorService.getReviews({ assessment: 'pending' }, {});
  const [filter, change] = Review.updateMany.mock.calls[0];
  expect(filter.rating).toEqual({ $gte: 4 });
  expect(JSON.stringify(change)).toContain('"moderatorAssessment.verdict":"good"');
});

test.each([
  [0, null],
  [2, 0],
  [5, 1],
  [8, 2]
])('a bad review after %i earlier ones counts and restricts the seller at 3, 6 and 9 (AC-MOD-05-2)', async (modBadReviewCount, durationIndex) => {
  const seller = { _id: sellerId, role: 'user', modBadReviewCount, save: jest.fn() };
  User.findById.mockResolvedValue(seller);
  const review = storedReview();
  Review.findById.mockResolvedValue(review);

  const result = await moderatorService.markSellerBadByReview('review', moderatorId, 'Giao sai hàng cho người mua');

  expect(seller.modBadReviewCount).toBe(modBadReviewCount + 1);
  expect(review.moderatorAssessment).toMatchObject({ isBad: true, verdict: 'bad', moderatorId });
  expect(result.sellerPenalty).toMatchObject({ modBadReviewCount: modBadReviewCount + 1, shouldSuspendNow: durationIndex !== null });
  expect(createNotification).toHaveBeenCalledWith(sellerId, expect.objectContaining({ reviewId: 'review' }));
  if (durationIndex === null) {
    expect(applySellingRestrictionToUser).not.toHaveBeenCalled();
    expect(seller.save).toHaveBeenCalled();
  } else {
    expect(applySellingRestrictionToUser).toHaveBeenCalledWith(seller, expect.objectContaining({
      durationMs: business.sanctionDurationsMs[durationIndex], source: 'review_moderation'
    }));
  }
});

test('an admin seller is never penalised for a review (INV-04)', async () => {
  User.findById.mockResolvedValue({ _id: sellerId, role: 'admin' });
  Review.findById.mockResolvedValue(storedReview());
  await expect(moderatorService.markSellerBadByReview('review', moderatorId, 'Ghi chú đủ dài')).rejects.toThrow('Không thể xử phạt tài khoản admin');
});
