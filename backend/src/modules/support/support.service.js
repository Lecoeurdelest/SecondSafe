const mongoose = require('mongoose');
const SupportConversation = require('./support-conversation.model');
const SupportMessage = require('./support-message.model');
const { encryptChatContent, decryptChatContent } = require('../../common/utils/chat-crypto.util');
const { pagination } = require('../../common/utils/pagination.util');

const STAFF_ROLES = new Set(['moderator', 'admin']);
const CUSTOMER_FIELDS = 'fullName avatar';

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function requireId(value) {
  if (!mongoose.Types.ObjectId.isValid(String(value || ''))) throw httpError(400, 'Mã cuộc trò chuyện không hợp lệ.');
  return String(value);
}

function decodeMessage(messageDoc) {
  const message = typeof messageDoc.toObject === 'function' ? messageDoc.toObject() : { ...messageDoc };
  try {
    message.content = decryptChatContent(message.content);
  } catch {
    message.content = '[Tin nhắn không thể giải mã]';
  }
  return message;
}

function decodePreview(conversationDoc) {
  const conversation = typeof conversationDoc.toObject === 'function'
    ? conversationDoc.toObject()
    : { ...conversationDoc };
  if (conversation.lastMessage) {
    try {
      conversation.lastMessage = decryptChatContent(conversation.lastMessage);
    } catch {
      conversation.lastMessage = '[Tin nhắn không thể giải mã]';
    }
  }
  return conversation;
}

async function getConversation(conversationId, userId, role) {
  const conversation = await SupportConversation.findById(requireId(conversationId))
    .populate('customerId', CUSTOMER_FIELDS)
    .populate('assignedStaffId', CUSTOMER_FIELDS);
  if (!conversation) throw httpError(404, 'Cuộc trò chuyện hỗ trợ không tồn tại.');
  const isStaff = STAFF_ROLES.has(role);
  if (!isStaff && String(conversation.customerId?._id || conversation.customerId) !== String(userId)) {
    throw httpError(403, 'Bạn không có quyền truy cập cuộc trò chuyện hỗ trợ này.');
  }
  return conversation;
}

async function listConversations(userId, role, query = {}) {
  const { page, limit, skip } = pagination({ ...query, limit: query.limit || 20 });
  const filter = STAFF_ROLES.has(role) ? {} : { customerId: userId };
  if (query.status === 'open' || query.status === 'closed') filter.status = query.status;
  const [conversations, total] = await Promise.all([
    SupportConversation.find(filter)
      .populate('customerId', CUSTOMER_FIELDS)
      .populate('assignedStaffId', CUSTOMER_FIELDS)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportConversation.countDocuments(filter)
  ]);
  return {
    conversations: conversations.map(decodePreview),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function createConversation(userId, role, { subject, message }) {
  if (role !== 'user') throw httpError(403, 'Chỉ khách hàng mới có thể mở yêu cầu hỗ trợ.');
  if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 120) {
    throw httpError(400, 'Tiêu đề hỗ trợ phải có từ 1 đến 120 ký tự.');
  }
  const content = normalizeMessage(message);
  const conversation = await SupportConversation.create({
    customerId: userId,
    subject: subject.trim(),
    lastMessage: encryptChatContent(content),
    lastMessageAt: new Date(),
    staffUnreadCount: 1
  });
  const createdMessage = await SupportMessage.create({
    conversationId: conversation._id,
    senderId: userId,
    senderRole: 'user',
    content: encryptChatContent(content)
  });
  await conversation.populate([
    { path: 'customerId', select: CUSTOMER_FIELDS },
    { path: 'assignedStaffId', select: CUSTOMER_FIELDS }
  ]);
  return { conversation: decodePreview(conversation), message: decodeMessage(createdMessage) };
}

function normalizeMessage(value) {
  if (typeof value !== 'string' || !value.trim()) throw httpError(400, 'Nội dung tin nhắn không được để trống.');
  const content = value.trim();
  if (content.length > 2000) throw httpError(400, 'Tin nhắn không được vượt quá 2.000 ký tự.');
  return content;
}

async function getMessages(conversationId, userId, role, query = {}) {
  const conversation = await getConversation(conversationId, userId, role);
  const { page, limit, skip } = pagination({ limit: 50, ...query });
  const [messages, total] = await Promise.all([
    SupportMessage.find({ conversationId: conversation._id })
      .populate('senderId', CUSTOMER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportMessage.countDocuments({ conversationId: conversation._id })
  ]);
  const unreadField = STAFF_ROLES.has(role) ? 'staffUnreadCount' : 'customerUnreadCount';
  await Promise.all([
    SupportConversation.updateOne({ _id: conversation._id }, { $set: { [unreadField]: 0 } }),
    SupportMessage.updateMany(
      { conversationId: conversation._id, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    )
  ]);
  return {
    messages: messages.reverse().map(decodeMessage),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function sendMessage(conversationId, userId, role, value) {
  const conversation = await getConversation(conversationId, userId, role);
  if (conversation.status !== 'open') throw httpError(409, 'Cuộc trò chuyện đã đóng.');
  const content = normalizeMessage(value);
  const isStaff = STAFF_ROLES.has(role);
  const senderId = userId;
  const message = await SupportMessage.create({
    conversationId: conversation._id,
    senderId,
    senderRole: role,
    content: encryptChatContent(content)
  });
  const update = {
    $set: {
      lastMessage: encryptChatContent(content),
      lastMessageAt: message.createdAt
    },
    $inc: { [isStaff ? 'customerUnreadCount' : 'staffUnreadCount']: 1 }
  };
  if (isStaff && !conversation.assignedStaffId) update.$set.assignedStaffId = userId;
  await SupportConversation.updateOne({ _id: conversation._id }, update);
  await message.populate('senderId', CUSTOMER_FIELDS);
  return { conversation, message: decodeMessage(message) };
}

async function updateStatus(conversationId, userId, role, status) {
  if (!STAFF_ROLES.has(role)) throw httpError(403, 'Chỉ nhân viên hỗ trợ mới có thể cập nhật trạng thái.');
  if (!['open', 'closed'].includes(status)) throw httpError(400, 'Trạng thái cuộc trò chuyện không hợp lệ.');
  const conversation = await SupportConversation.findByIdAndUpdate(
    requireId(conversationId),
    { $set: { status, ...(status === 'open' ? { assignedStaffId: userId } : {}) } },
    { new: true, runValidators: true }
  )
    .populate('customerId', CUSTOMER_FIELDS)
    .populate('assignedStaffId', CUSTOMER_FIELDS);
  if (!conversation) throw httpError(404, 'Cuộc trò chuyện hỗ trợ không tồn tại.');
  return decodePreview(conversation);
}

module.exports = {
  getConversation,
  listConversations,
  createConversation,
  getMessages,
  sendMessage,
  updateStatus,
  isStaffRole: role => STAFF_ROLES.has(role)
};
