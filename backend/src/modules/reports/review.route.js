const express = require('express');
const controller = require('./review.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.post('/orders/:orderId/rate', authenticate, controller.createReview);
router.get('/orders/:orderId/review', controller.getReviewByOrderId);
router.get('/orders/:orderId/can-review', authenticate, controller.canReviewOrder);
router.get('/users/:userId/reviews', controller.getReviews);
router.get('/users/:userId/rating-stats', controller.getRatingStats);
router.get('/reviews/my-reviews', authenticate, controller.getMyReviews);
router.get('/reviews/:reviewId', controller.getReviewById);
router.put('/reviews/:reviewId', authenticate, controller.updateReview);
router.delete('/reviews/:reviewId', authenticate, controller.deleteReview);

module.exports = router;
