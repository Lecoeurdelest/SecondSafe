const express = require('express');
const controller = require('./report.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.post('/reports/product', authenticate, controller.createProductReport);
router.post('/reports/user', authenticate, controller.createUserReport);
router.get('/reports/my-reports', authenticate, controller.getMyReports);
router.get('/reports/:reportId', authenticate, controller.getReportById);

module.exports = router;
