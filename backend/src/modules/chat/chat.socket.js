const chatService = require('./chat.service');
const User = require('../users/user.model');
const { verifyToken } = require('../../common/utils/jwt.util');
const logger = require('../../common/utils/logger.util');
const { createMemoryStore } = require('../../common/utils/expiring-store.util');
const supportService = require('../support/support.service');

// Presence dung chung store interface voi OTP (NFR-REL-04): mac dinh in-memory,
// adapter dung chung (D-108) duoc truyen vao initializeChatSocket.
// Han du phong de ban ghi mo coi (process chet giua chung) tu het han.
const PRESENCE_TTL_MS = 24 * 60 * 60 * 1000;
let presenceStore = createMemoryStore();
let ioInstance = null;

const userRoom = userId => `user:${userId}`;
const conversationRoom = conversationId => `conversation:${conversationId}`;
const supportConversationRoom = conversationId => `support-conversation:${conversationId}`;
const supportStaffRoom = 'support-staff-inbox';

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

const presenceKey = userId => `presence:${userId}`;

// Dem so socket dang mo cua user (nhieu tab); tra ve so luong sau khi cap nhat.
function changePresence(userId, delta) {
  return presenceStore.update(presenceKey(userId), previous => {
    const count = Math.max(0, (previous?.count || 0) + delta);
    return { record: count > 0 ? { count, expiresAt: Date.now() + PRESENCE_TTL_MS } : null, result: count };
  });
}

// Lay tu cac socket dang ket noi (fetchSockets hoat dong ca khi co adapter dung chung).
async function onlineUserIds(io) {
  const sockets = await io.fetchSockets();
  return Array.from(new Set(sockets.map(item => item.data.user?.userId).filter(Boolean)));
}

async function announcePresence(io, socket, userId) {
  try {
    if (await changePresence(userId, 1) === 1) socket.broadcast.emit('user_online', { userId });
    socket.emit('online_users', await onlineUserIds(io));
  } catch (error) {
    logger.error('Socket presence update failed', error);
  }
}

function registerHandlers(io, socket) {
  const { userId, role } = socket.data.user;

  socket.join(userRoom(userId));
  if (supportService.isStaffRole(role)) socket.join(supportStaffRoom);

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

  socket.on('join_support_conversation', guarded(socket, async data => {
    const conversationId = conversationIdOf(data);
    await supportService.getConversation(conversationId, userId, role);
    socket.join(supportConversationRoom(conversationId));
    return { conversationId };
  }));

  socket.on('leave_support_conversation', data => {
    const conversationId = conversationIdOf(data);
    if (conversationId) socket.leave(supportConversationRoom(conversationId));
  });

  socket.on('send_support_message', guarded(socket, async data => {
    const result = await supportService.sendMessage(
      data.conversationId, userId, role, data.content
    );
    emitSupportUpdate(result.conversation, result.message);
    return result.message;
  }));

  socket.on('disconnect', async () => {
    try {
      if (await changePresence(userId, -1) === 0) socket.broadcast.emit('user_offline', { userId });
    } catch (error) {
      logger.error('Socket presence update failed', error);
    }
  });

  // Dang ky handler truoc, cap nhat presence sau: khong lo su kien gui ngay sau khi ket noi.
  announcePresence(io, socket, userId);
}

function initializeChatSocket(io, { store } = {}) {
  ioInstance = io;
  if (store) presenceStore = store;
  io.use(authenticateSocket);
  io.on('connection', socket => registerHandlers(io, socket));
  logger.info('Socket.IO chat gateway initialized');
}

async function isUserOnline(userId) {
  const count = await presenceStore.update(presenceKey(String(userId)), previous => ({ record: previous, result: previous?.count || 0 }));
  return count > 0;
}

function emitToUser(userId, eventName, payload) {
  if (ioInstance && userId && eventName) ioInstance.to(userRoom(String(userId))).emit(eventName, payload);
}

// Ten cu ma module orders (offer trong chat) dang goi: chi phat toi phong cuoc tro chuyen.
function emitMessageToConversation(conversationId, message) {
  emitNewMessage(conversationId, message);
}

function emitSupportUpdate(conversation, message) {
  if (!ioInstance || !conversation) return;
  const conversationId = String(conversation._id);
  if (message) {
    ioInstance.to(supportConversationRoom(conversationId)).emit('support_receive_message', {
      conversationId,
      message
    });
  }
  const customerId = String(conversation.customerId?._id || conversation.customerId || '');
  ioInstance.to(supportStaffRoom).emit('support_inbox_updated', { conversationId });
  if (customerId) {
    ioInstance.to(userRoom(customerId)).emit('support_conversation_updated', { conversationId });
  }
}

module.exports = {
  initializeChatSocket,
  emitNewMessage,
  emitMessageToConversation,
  emitToUser,
  emitSupportUpdate,
  isUserOnline
};
