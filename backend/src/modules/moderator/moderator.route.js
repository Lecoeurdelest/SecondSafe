const express = require('express');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/role.middleware');
const dashboardController = require('./moderator.dashboard.controller');
const controller = require('./moderator.controller');

const router = express.Router();

// requireRole('moderator') also admits admins.
router.use(authenticate, requireRole('moderator'));

router.get('/dashboard', dashboardController.getDashboard);
router.get('/revenue-report', controller.getRevenueReport);

router.post('/users/:id/ban', controller.banUser);

router.get('/reports', controller.getReports);
router.get('/reports/:reportId', controller.getReportById);
router.put('/reports/:reportId/resolve', controller.resolveReport);

router.get('/orders', controller.getOrders);
router.get('/orders/:id', controller.getOrderById);
router.post('/orders/:id/force-cancel', controller.forceCancelOrder);
router.patch('/orders/:id/status', controller.updateOrderStatus);

router.get('/reviews', controller.getReviews);
router.patch('/reviews/:reviewId/hide', controller.hideReview);
router.patch('/reviews/:reviewId/mark-bad', controller.markSellerBadByReview);
router.patch('/reviews/:reviewId/mark-good', controller.markSellerGoodByReview);

router.get('/withdrawals', controller.getWithdrawals);
router.patch('/withdrawals/:withdrawalId/status', controller.updateWithdrawalStatus);

router.get('/disputes', controller.getDisputes);
router.get('/disputes/:disputeId', controller.getDisputeById);
router.patch('/disputes/:disputeId/investigating', controller.markDisputeInvestigating);
router.post('/disputes/:disputeId/message', controller.sendDisputeMessage);
router.put('/disputes/:disputeId/resolve', controller.resolveDispute);

module.exports = router;
