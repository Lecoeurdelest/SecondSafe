const reviewService = require('./review.service');
const { sendSuccess } = require('../../common/utils/response.util');

function handle(action) {
  return async (req, res, next) => {
    try {
      return await action(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
}

const createReview = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.createReview(req.user.userId, req.params.orderId, req.body), 'Đánh giá thành công'
));

const getReviews = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.getReviews(req.params.userId, req.query)
));

const getRatingStats = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.getRatingStats(req.params.userId)
));

const getReviewById = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.getReviewById(req.params.reviewId)
));

const getReviewByOrderId = handle(async (req, res) => {
  const review = await reviewService.getReviewByOrderId(req.params.orderId);
  return sendSuccess(res, 200, review, review ? null : 'Chưa có đánh giá cho đơn hàng này');
});

const canReviewOrder = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.canReviewOrder(req.user.userId, req.params.orderId)
));

const updateReview = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.updateReview(req.params.reviewId, req.user.userId, req.body), 'Cập nhật đánh giá thành công'
));

const deleteReview = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.deleteReview(req.params.reviewId, req.user.userId), 'Xóa đánh giá thành công'
));

const getMyReviews = handle(async (req, res) => sendSuccess(
  res, 200, await reviewService.getReviewsByReviewer(req.user.userId, req.query)
));

module.exports = {
  createReview,
  getReviews,
  getRatingStats,
  getReviewById,
  getReviewByOrderId,
  canReviewOrder,
  updateReview,
  deleteReview,
  getMyReviews
};
