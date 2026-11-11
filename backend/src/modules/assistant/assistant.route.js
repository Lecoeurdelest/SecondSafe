const express = require('express');
const controller = require('./assistant.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/role.middleware');
const { createAuthRateLimit } = require('../../common/middlewares/rate-limit.middleware');

const router = express.Router();
const assistantLimiter = createAuthRateLimit({
  scope: 'assistant',
  limit: 12,
  windowMs: 60 * 1000
});

router.use(authenticate);
router.post('/ask', assistantLimiter, controller.ask);
router.post('/moderation/reports/:reportId/guidance', requireRole('moderator'), assistantLimiter, controller.getModerationGuidance);

module.exports = router;
