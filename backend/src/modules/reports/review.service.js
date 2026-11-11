const mongoose = require('mongoose');
const Review = require('./review.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const { pagination } = require('../../common/utils/pagination.util');

const EVIDENCE_PATH = /^\/uploads\/evidence\/[\w-]+\/[\w.-]+\.(png|jpe?g|mp4)$/i;
const MAX_EVIDENCE_FILES = 5;
const AUTO_APPROVE_RATING = 4;

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function requireObjectId(value, message) {
  if (!mongoose.Types.ObjectId.isValid(value)) throw httpError(404, message);
  return value;
}

function validateRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, 'Đánh giá phải từ 1 đến 5 sao');
  return rating;
}

function validateComment(value) {
  const comment = typeof value === 'string' ? value.trim() : '';
  if (comment.length > 500) throw httpError(400, 'Nhận xét không được vượt quá 500 ký tự');
  return comment;
}

// Evidence must point at files stored by the evidence upload endpoint.
function validateEvidence(files = []) {
  if (!Array.isArray(files)) throw httpError(400, 'Danh sách bằng chứng không hợp lệ');
  const paths = files.map(file => String(file || '').trim()).filter(Boolean);
  if (paths.length > MAX_EVIDENCE_FILES) throw httpError(400, 'Tối đa 5 tệp bằng chứng cho mỗi đánh giá');
  if (!paths.every(file => EVIDENCE_PATH.test(file))) {
    throw httpError(400, 'Định dạng bằng chứng không hợp lệ. Chỉ chấp nhận PNG, JPG/JPEG hoặc MP4.');
  }
  return paths;
}

// Older documents stored evidence under evidenceImages only; clients read both fields.
function toClientReview(review) {
  if (!review) return review;
  const raw = typeof review.toObject === 'function' ? review.toObject() : review;
  const files = [...new Set([...(raw.evidenceFiles || []), ...(raw.evidenceImages || [])])].slice(0, MAX_EVIDENCE_FILES);
  return { ...raw, evidenceFiles: files, evidenceImages: files };
}

// Ratings of four stars and above need no moderator judgement.
function initialAssessment(rating) {
  if (rating < AUTO_APPROVE_RATING) return { isReviewed: false, isBad: false, verdict: null, note: '', markedAt: null, penaltyLevel: 0 };
  return {
    isReviewed: true,
    isBad: false,
    verdict: 'good',
    note: 'Tự động duyệt: đánh giá từ 4 sao trở lên',
    markedAt: new Date(),
    penaltyLevel: 0
  };
}

async function updateUserRating(userId) {
  const stats = await Review.calculateAverageRating(userId);
  await User.findByIdAndUpdate(userId, { rating: stats.averageRating, totalReviews: stats.totalReviews });
  return stats;
}

async function reviewEligibility(userId, orderId) {
  const order = mongoose.Types.ObjectId.isValid(orderId) ? await Order.findById(orderId) : null;
  if (!order) return { canReview: false, reason: 'Đơn hàng không tồn tại', statusCode: 404 };
  if (String(order.buyerId) !== String(userId)) return { canReview: false, reason: 'Chỉ người mua mới có thể đánh giá', statusCode: 403 };
  if (order.status !== 'completed') return { canReview: false, reason: 'Chỉ có thể đánh giá sau khi đơn hàng hoàn thành', statusCode: 400 };
  if (await Review.exists({ orderId })) return { canReview: false, reason: 'Bạn đã đánh giá đơn hàng này rồi', statusCode: 409 };
  return { canReview: true, order };
}

async function canReviewOrder(userId, orderId) {
  const { canReview, reason } = await reviewEligibility(userId, orderId);
  return canReview ? { canReview } : { canReview, reason };
}

async function createReview(reviewerId, orderId, input = {}) {
  const rating = validateRating(input.rating);
  const comment = validateComment(input.comment);
  const evidence = validateEvidence(input.evidenceFiles);
  const eligibility = await reviewEligibility(reviewerId, orderId);
  if (!eligibility.canReview) throw httpError(eligibility.statusCode, eligibility.reason);

  const { order } = eligibility;
  const review = await Review.create({
    orderId,
    reviewerId,
    reviewedUserId: order.sellerId,
    productId: order.productId,
    rating,
    comment,
    evidenceFiles: evidence,
    evidenceImages: evidence,
    moderatorAssessment: initialAssessment(rating),
    status: 'active'
  });
  await updateUserRating(order.sellerId);
  await review.populate([
    { path: 'reviewerId', select: 'fullName avatar' },
    { path: 'reviewedUserId', select: 'fullName avatar' },
    { path: 'productId', select: 'title images' },
    { path: 'orderId', select: 'agreedAmount' }
  ]);
  return toClientReview(review);
}

async function getReviews(userId, query = {}) {
  requireObjectId(userId, 'Người dùng không tồn tại');
  const { page, limit, skip } = pagination(query);
  const filter = { reviewedUserId: userId, status: 'active' };
  if (query.rating !== undefined && query.rating !== '') filter.rating = validateRating(query.rating);

  const [reviews, total, stats] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewerId', 'fullName avatar')
      .populate('productId', 'title images')
      .populate('orderId', 'agreedAmount')
      .lean(),
    Review.countDocuments(filter),
    Review.calculateAverageRating(userId)
  ]);
  return {
    reviews: reviews.map(toClientReview),
    stats,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function getReviewById(reviewId) {
  requireObjectId(reviewId, 'Đánh giá không tồn tại');
  const review = await Review.findOne({ _id: reviewId, status: 'active' })
    .populate('reviewerId', 'fullName avatar')
    .populate('reviewedUserId', 'fullName avatar rating totalReviews')
    .populate('productId', 'title images price')
    .populate('orderId', 'agreedAmount status')
    .lean();
  if (!review) throw httpError(404, 'Đánh giá không tồn tại');
  return toClientReview(review);
}

// Returns null while the order has no review yet.
async function getReviewByOrderId(orderId) {
  requireObjectId(orderId, 'Đơn hàng không tồn tại');
  const review = await Review.findOne({ orderId })
    .populate('reviewerId', 'fullName avatar')
    .populate('reviewedUserId', 'fullName avatar')
    .populate('productId', 'title images')
    .lean();
  return toClientReview(review);
}

async function requireOwnReview(reviewId, reviewerId, deniedMessage) {
  requireObjectId(reviewId, 'Đánh giá không tồn tại');
  const review = await Review.findById(reviewId);
  if (!review) throw httpError(404, 'Đánh giá không tồn tại');
  if (String(review.reviewerId) !== String(reviewerId)) throw httpError(403, deniedMessage);
  return review;
}

async function updateReview(reviewId, reviewerId, input = {}) {
  const review = await requireOwnReview(reviewId, reviewerId, 'Bạn không có quyền chỉnh sửa đánh giá này');
  if (input.rating !== undefined && input.rating !== null) {
    review.rating = validateRating(input.rating);
    review.moderatorAssessment = initialAssessment(review.rating);
  }
  if (input.comment !== undefined) review.comment = validateComment(input.comment);
  await review.save();
  await updateUserRating(review.reviewedUserId);
  return toClientReview(review);
}

async function deleteReview(reviewId, reviewerId) {
  const review = await requireOwnReview(reviewId, reviewerId, 'Bạn không có quyền xóa đánh giá này');
  review.status = 'hidden';
  await review.save();
  await updateUserRating(review.reviewedUserId);
  return toClientReview(review);
}

async function getRatingStats(userId) {
  requireObjectId(userId, 'Người dùng không tồn tại');
  const [stats, rows] = await Promise.all([
    Review.calculateAverageRating(userId),
    Review.aggregate([
      { $match: { reviewedUserId: new mongoose.Types.ObjectId(userId), status: 'active' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ])
  ]);
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const row of rows) distribution[row._id] = row.count;
  return { ...stats, distribution };
}

async function getReviewsByReviewer(reviewerId, query = {}) {
  const { page, limit, skip } = pagination(query);
  const filter = { reviewerId };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewedUserId', 'fullName avatar')
      .populate('productId', 'title images')
      .populate('orderId', 'agreedAmount')
      .lean(),
    Review.countDocuments(filter)
  ]);
  return { reviews: reviews.map(toClientReview), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = {
  createReview,
  updateUserRating,
  getReviews,
  getReviewById,
  getReviewByOrderId,
  updateReview,
  deleteReview,
  getRatingStats,
  canReviewOrder,
  getReviewsByReviewer
};
