const express = require('express');
const controller = require('./support.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/role.middleware');
const { createAuthRateLimit } = require('../../common/middlewares/rate-limit.middleware');

const router = express.Router();
const supportMessageLimiter = createAuthRateLimit({
  scope: 'support-message',
  limit: 30,
  windowMs: 60 * 1000
});

router.use(authenticate);
router.get('/conversations', controller.listConversations);
router.post('/conversations', controller.createConversation);
router.get('/conversations/:id/messages', controller.getMessages);
router.post('/conversations/:id/messages', supportMessageLimiter, controller.sendMessage);
router.patch('/conversations/:id/status', requireRole('moderator'), controller.updateStatus);

module.exports = router;
