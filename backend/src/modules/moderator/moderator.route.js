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

module.exports = router;
