const chatService = require('./chat.service');
const User = require('../users/user.model');
const { verifyToken } = require('../../common/utils/jwt.util');
const logger = require('../../common/utils/logger.util');

// userId -> so socket dang mo (mot user co the mo nhieu tab).
const onlineUsers = new Map();
let ioInstance = null;

const userRoom = userId => `user:${userId}`;
const conversationRoom = conversationId => `conversation:${conversationId}`;

function handshakeToken(socket) {
  const header = socket.handshake.headers?.authorization;
  return socket.handshake.auth?.token || (typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '');
}

async function authenticateSocket(socket, next) {
  try {
    const { userId } = verifyToken(handshakeToken(socket));
    const user = await User.findById(userId).select('_id role fullName avatar').lean();
    if (!user || !['user', 'moderator', 'admin'].includes(user.role)) throw new Error('unknown user');
    socket.data.user = { userId: String(user._id), role: user.role, fullName: user.fullName, avatar: user.avatar };
    return next();
  } catch {
    return next(new Error('Authentication error'));
  }
}

function conversationIdOf(data) {
  return typeof data === 'string' ? data : data?.conversationId;
}

// Boc handler de loi nghiep vu tra ve client thay vi lam sap ket noi.
function guarded(socket, handler) {
  return async (data, ack) => {
    try {
      const result = await handler(data || {});
      if (typeof ack === 'function') ack({ success: true, data: result });
    } catch (error) {
      const message = error.statusCode ? error.message : 'Lỗi hệ thống, vui lòng thử lại sau';
      if (typeof ack === 'function') ack({ success: false, message });
      socket.emit('chat_error', { message });
    }
  };
}

/**
 * Phat tin nhan moi toi phong cuoc tro chuyen va thong bao rieng cho nguoi nhan
 * (dung cho badge tin chua doc). Dung chung cho socket va REST fallback.
 */
function emitNewMessage(conversationId, message, recipients = []) {
  if (!ioInstance || !conversationId || !message) return;
  ioInstance.to(conversationRoom(conversationId)).emit('receive_message', {
    conversationId,
    message: { ...message, conversation: conversationId }
  });
  for (const recipientId of recipients) {
    ioInstance.to(userRoom(recipientId)).emit('new_message_notification', { conversationId, message });
  }
}

function trackOnline(userId, delta) {
  const count = (onlineUsers.get(userId) || 0) + delta;
  if (count > 0) onlineUsers.set(userId, count);
  else onlineUsers.delete(userId);
  return count;
}

function registerHandlers(io, socket) {
  const { userId, role } = socket.data.user;

  socket.join(userRoom(userId));
  if (trackOnline(userId, 1) === 1) socket.broadcast.emit('user_online', { userId });
  socket.emit('online_users', Array.from(onlineUsers.keys()));

  socket.on('join_conversation', guarded(socket, async data => {
    const conversationId = conversationIdOf(data);
    await chatService.markMessagesAsRead(conversationId, userId, role);
    socket.join(conversationRoom(conversationId));
    socket.emit('joined_conversation', { conversationId });
    return { conversationId };
  }));

  socket.on('leave_conversation', data => {
    const conversationId = conversationIdOf(data);
    if (conversationId) socket.leave(conversationRoom(conversationId));
  });

  socket.on('send_message', guarded(socket, async ({ conversationId, content, type, metadata }) => {
    const { message, recipients } = await chatService.sendMessage(
      conversationId, userId, { content, type, metadata }, role
    );
    emitNewMessage(String(conversationId), message, recipients);
    return message;
  }));

  // Chi phat typing toi phong da tham gia (da kiem tra quyen khi join).
  for (const [event, outgoing] of [['typing', 'user_typing'], ['stop_typing', 'user_stop_typing']]) {
    socket.on(event, data => {
      const conversationId = conversationIdOf(data);
      if (conversationId && socket.rooms.has(conversationRoom(conversationId))) {
        socket.to(conversationRoom(conversationId)).emit(outgoing, { conversationId, userId });
      }
    });
  }

  socket.on('mark_as_read', guarded(socket, async data => {
    const result = await chatService.markMessagesAsRead(conversationIdOf(data), userId, role);
    socket.emit('marked_as_read', result);
    return result;
  }));

  socket.on('disconnect', () => {
    if (trackOnline(userId, -1) === 0) socket.broadcast.emit('user_offline', { userId });
  });
}

function initializeChatSocket(io) {
  ioInstance = io;
  io.use(authenticateSocket);
  io.on('connection', socket => registerHandlers(io, socket));
  logger.info('Socket.IO chat gateway initialized');
}

function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

function emitToUser(userId, eventName, payload) {
  if (ioInstance && userId && eventName) ioInstance.to(userRoom(String(userId))).emit(eventName, payload);
}

// Ten cu ma module orders (offer trong chat) dang goi: chi phat toi phong cuoc tro chuyen.
function emitMessageToConversation(conversationId, message) {
  emitNewMessage(conversationId, message);
}

module.exports = { initializeChatSocket, emitNewMessage, emitMessageToConversation, emitToUser, isUserOnline };
