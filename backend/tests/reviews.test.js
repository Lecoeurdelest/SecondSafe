jest.mock('../src/modules/reports/review.model', () => ({
  create: jest.fn(), exists: jest.fn(), calculateAverageRating: jest.fn(), findById: jest.fn()
}));
jest.mock('../src/modules/orders/order.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findByIdAndUpdate: jest.fn() }));

const Review = require('../src/modules/reports/review.model');
const Order = require('../src/modules/orders/order.model');
const User = require('../src/modules/users/user.model');
const service = require('../src/modules/reports/review.service');

const buyerId = '507f1f77bcf86cd799439011';
const sellerId = '507f1f77bcf86cd799439012';
const orderId = '507f1f77bcf86cd799439013';
const evidence = '/uploads/evidence/temp/1-abc.jpg';

beforeEach(() => {
  jest.resetAllMocks();
  Order.findById.mockResolvedValue({ _id: orderId, buyerId, sellerId, productId: 'product', status: 'completed' });
  Review.exists.mockResolvedValue(null);
  Review.calculateAverageRating.mockResolvedValue({ averageRating: 4.5, totalReviews: 2 });
  Review.create.mockImplementation(async data => ({ ...data, populate: jest.fn(), toObject() { return data; } }));
});

test('the buyer of a completed order rates the seller once and the seller rating is recalculated', async () => {
  const review = await service.createReview(buyerId, orderId, { rating: 5, comment: ' Tốt ', evidenceFiles: [evidence] });

  expect(review).toMatchObject({ rating: 5, comment: 'Tốt', reviewedUserId: sellerId, evidenceFiles: [evidence] });
  expect(review.moderatorAssessment).toMatchObject({ isReviewed: true, verdict: 'good' });
  expect(User.findByIdAndUpdate).toHaveBeenCalledWith(sellerId, { rating: 4.5, totalReviews: 2 });
});

test('a low rating waits for moderator judgement', async () => {
  const review = await service.createReview(buyerId, orderId, { rating: 2 });
  expect(review.moderatorAssessment).toMatchObject({ isReviewed: false, verdict: null });
});

test.each([
  ['someone who is not the buyer', () => {}, sellerId, 403],
  ['an order that is not completed', () => Order.findById.mockResolvedValue({ buyerId, status: 'delivered' }), buyerId, 400],
  ['an order already reviewed', () => Review.exists.mockResolvedValue({ _id: 'review' }), buyerId, 409],
  ['a missing order', () => Order.findById.mockResolvedValue(null), buyerId, 404]
])('rejects a review from %s', async (name, arrange, reviewerId, statusCode) => {
  arrange();
  await expect(service.createReview(reviewerId, orderId, { rating: 4 })).rejects.toMatchObject({ statusCode });
  expect(Review.create).not.toHaveBeenCalled();
});

test.each([
  [{ rating: 6 }],
  [{ rating: 4.5 }],
  [{ rating: 4, evidenceFiles: ['https://evil.example/x.jpg'] }],
  [{ rating: 4, evidenceFiles: Array(6).fill(evidence) }],
  [{ rating: 4, comment: 'a'.repeat(501) }]
])('rejects invalid review input %j', async input => {
  await expect(service.createReview(buyerId, orderId, input)).rejects.toMatchObject({ statusCode: 400 });
});

test('can-review reports the reason without throwing', async () => {
  expect(await service.canReviewOrder(buyerId, orderId)).toEqual({ canReview: true });
  expect(await service.canReviewOrder(sellerId, orderId)).toEqual({ canReview: false, reason: 'Chỉ người mua mới có thể đánh giá' });
});

test('only the author can edit or hide a review', async () => {
  const review = { reviewerId: buyerId, reviewedUserId: sellerId, rating: 5, save: jest.fn(), toObject() { return { rating: this.rating, status: this.status }; } };
  Review.findById.mockResolvedValue(review);

  await expect(service.updateReview(orderId, sellerId, { rating: 1 })).rejects.toMatchObject({ statusCode: 403 });
  expect(await service.deleteReview(orderId, buyerId)).toMatchObject({ status: 'hidden' });
  expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(1);
});
