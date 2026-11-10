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

module.exports = router;
