const chatService = require('./chat.service');
const { emitNewMessage } = require('./chat.socket');
const { sendSuccess } = require('../../common/utils/response.util');

function handle(action) {
  return async (req, res, next) => {
    try {
      return await action(req, res);
    } catch (error) {
      return next(error);
    }
  };
}

const getConversations = handle(async (req, res) => sendSuccess(
  res, 200, await chatService.getConversations(req.user.userId, req.query), 'Lấy danh sách cuộc trò chuyện thành công'
));

const createConversation = handle(async (req, res) => sendSuccess(
  res, 200,
  await chatService.openProductConversation(req.user.userId, req.body?.sellerId, req.body?.productId),
  'Mở cuộc trò chuyện thành công'
));

const getOrCreateConversationByOrder = handle(async (req, res) => sendSuccess(
  res, 200,
  await chatService.openOrderConversation(req.user.userId, req.params.orderId),
  'Mở cuộc trò chuyện theo đơn hàng thành công'
));

const getConversationById = handle(async (req, res) => sendSuccess(
  res, 200,
  await chatService.getConversationById(req.params.id, req.user.userId, req.user.role),
  'Lấy thông tin cuộc trò chuyện thành công'
));

const getMessages = handle(async (req, res) => sendSuccess(
  res, 200,
  await chatService.getMessages(req.params.id, req.user.userId, req.query, req.user.role),
  'Lấy tin nhắn thành công'
));

const markAsRead = handle(async (req, res) => sendSuccess(
  res, 200,
  await chatService.markMessagesAsRead(req.params.id, req.user.userId, req.user.role),
  'Đã đánh dấu đã đọc'
));

// REST fallback: cung hanh vi voi su kien socket send_message (AC-CHAT-02-3).
const sendMessage = handle(async (req, res) => {
  const { conversationId, content, type, metadata } = req.body || {};
  const { message, recipients } = await chatService.sendMessage(
    conversationId, req.user.userId, { content, type, metadata }, req.user.role
  );
  emitNewMessage(String(conversationId), message, recipients);
  return sendSuccess(res, 200, message, 'Gửi tin nhắn thành công');
});

module.exports = {
  getConversations,
  createConversation,
  getOrCreateConversationByOrder,
  getConversationById,
  getMessages,
  markAsRead,
  sendMessage
};
