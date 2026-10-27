const express = require('express');
const router = express.Router();
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireAdmin } = require('../../common/middlewares/admin.middleware');
const { changePassword } = require('../auth/auth.controller');
const { getDashboard } = require('./admin-dashboard.controller');

router.get('/admin/dashboard', authenticate, requireAdmin, getDashboard);
router.post('/change-password', authenticate, changePassword);
module.exports = router;
