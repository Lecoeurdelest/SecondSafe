const express = require('express');
const controller = require('./chat.controller');
const { uploadChatImage } = require('./chat.upload');
const { authenticate } = require('../../common/middlewares/auth.middleware');

const router = express.Router();

// Moi API chat deu yeu cau dang nhap.
router.use(authenticate);

router.get('/conversations', controller.getConversations);
router.post('/conversations', controller.createConversation);
router.get('/conversations/:id', controller.getConversationById);
router.get('/conversations/:id/messages', controller.getMessages);
router.patch('/conversations/:id/read', controller.markAsRead);
router.post('/conversations/:id/images', controller.requireParticipant, uploadChatImage, controller.uploadImage);
router.post('/orders/:orderId/conversation', controller.getOrCreateConversationByOrder);
router.post('/messages', controller.sendMessage);

module.exports = router;
