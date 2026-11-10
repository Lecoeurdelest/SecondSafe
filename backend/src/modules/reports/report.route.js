const express = require('express');
const controller = require('./report.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.post('/reports/product', authenticate, controller.createProductReport);
router.post('/reports/user', authenticate, controller.createUserReport);
router.get('/reports/my-reports', authenticate, controller.getMyReports);
router.get('/reports/:reportId', authenticate, controller.getReportById);

router.post('/orders/:orderId/dispute', authenticate, controller.createDispute);
router.get('/orders/:orderId/dispute', authenticate, controller.getDisputeByOrderId);
router.get('/disputes/my-disputes', authenticate, controller.getMyDisputes);
router.get('/disputes', authenticate, controller.getDisputes);
router.get('/disputes/:disputeId', authenticate, controller.getDisputeById);
router.post('/disputes/:disputeId/respond', authenticate, controller.addSellerResponse);
router.post('/disputes/:disputeId/buyer-follow-up', authenticate, controller.addBuyerFollowUp);
router.post('/disputes/:disputeId/confirm-return', authenticate, controller.confirmSellerReturn);

module.exports = router;
