const express = require('express');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/role.middleware');
const controller = require('./moderator.dashboard.controller');

const router = express.Router();

router.get('/dashboard', authenticate, requireRole('moderator'), controller.getDashboard);

module.exports = router;
