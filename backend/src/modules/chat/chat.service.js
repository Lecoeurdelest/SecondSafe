const mongoose = require('mongoose');
const Conversation = require('./conversation.model');
const Message = require('./message.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const { encryptChatContent, decryptChatContent } = require('../../common/utils/chat-crypto.util');
const { pagination } = require('../../common/utils/pagination.util');

const PARTY_FIELDS = 'fullName avatar';
const PRODUCT_FIELDS = 'title price images status';
const PRIVILEGED_ROLES = ['moderator', 'admin'];
const MESSAGE_TYPES = ['text', 'image'];
const MAX_TEXT_LENGTH = 1000;
const MAX_CAPTION_LENGTH = 500;

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function requireObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(String(value || ''))) throw httpError(400, `${label} không hợp lệ`);
  return String(value);
}

function idOf(value) {
  return String(value?._id || value || '');
}

function populateConversation(query) {
  return query
    .populate('productId', PRODUCT_FIELDS)
    .populate('buyerId', PARTY_FIELDS)
    .populate('sellerId', PARTY_FIELDS);
}

// Giai ma truoc khi tra ve client; ban ghi hong khong lam vo ca luong chat.
function toClientMessage(messageDoc) {
  if (!messageDoc) return messageDoc;
  const message = typeof messageDoc.toObject === 'function' ? messageDoc.toObject() : { ...messageDoc };
  if (typeof message.content === 'string') {
    try {
      message.content = decryptChatContent(message.content);
    } catch {
      message.content = '[Tin nhắn không thể giải mã]';
    }
  }
  return message;
}

async function isPrivileged(userId, role) {
  if (role) return PRIVILEGED_ROLES.includes(role);
  const actor = await User.findById(userId).select('role').lean();
  return PRIVILEGED_ROLES.includes(String(actor?.role || ''));
}

async function findOrCreateConversation(buyerId, sellerId, productId) {
  if (buyerId === sellerId) throw httpError(400, 'Không thể tạo cuộc trò chuyện với chính mình');
  const existing = await populateConversation(Conversation.findOne({ buyerId, sellerId, productId }));
  if (existing) return existing;
  const created = await Conversation.create({ buyerId, sellerId, productId });
  await created.populate([
    { path: 'productId', select: PRODUCT_FIELDS },
    { path: 'buyerId', select: PARTY_FIELDS },
    { path: 'sellerId', select: PARTY_FIELDS }
  ]);
  return created;
}

/**
 * Mo cuoc tro chuyen ve mot san pham. Nguoi ban luon la chu san pham,
 * nguoi mua la ben con lai (ke ca khi chinh nguoi ban la nguoi mo).
 */
async function openProductConversation(actorId, counterpartId, productId) {
  const actor = requireObjectId(actorId, 'Người dùng');
  const counterpart = requireObjectId(counterpartId, 'sellerId');
  const product = await Product.findById(requireObjectId(productId, 'productId')).select('seller').lean();
  if (!product?.seller) throw httpError(404, 'Sản phẩm không tồn tại');
  if (actor === counterpart) throw httpError(400, 'Không thể tạo cuộc trò chuyện với chính mình');

  const sellerId = idOf(product.seller);
  const buyerId = actor === sellerId ? counterpart : actor;
  return findOrCreateConversation(buyerId, sellerId, String(productId));
}

async function openOrderConversation(actorId, orderId) {
  const order = await Order.findById(requireObjectId(orderId, 'orderId')).select('buyerId sellerId productId').lean();
  if (!order) throw httpError(404, 'Đơn hàng không tồn tại');
  const buyerId = idOf(order.buyerId);
  const sellerId = idOf(order.sellerId);
  if (![buyerId, sellerId].includes(String(actorId))) {
    throw httpError(403, 'Bạn không có quyền truy cập cuộc trò chuyện của đơn hàng này');
  }
  if (!buyerId || !sellerId || !idOf(order.productId)) {
    throw httpError(400, 'Thông tin đơn hàng không đầy đủ để mở cuộc trò chuyện');
  }
  return findOrCreateConversation(buyerId, sellerId, idOf(order.productId));
}

async function getConversations(userId, query = {}) {
  const { page, limit, skip } = pagination(query);
  const filter = { $or: [{ buyerId: userId }, { sellerId: userId }], status: 'active' };
  const [conversations, total] = await Promise.all([
    populateConversation(Conversation.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit)),
    Conversation.countDocuments(filter)
  ]);
  return { conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/**
 * Chi buyer/seller cua cuoc tro chuyen, moderator va admin duoc truy cap (INV-05).
 */
async function getConversationById(conversationId, userId, role) {
  const conversation = await populateConversation(
    Conversation.findById(requireObjectId(conversationId, 'conversationId'))
  );
  if (!conversation) throw httpError(404, 'Cuộc trò chuyện không tồn tại');
  const isParticipant = [idOf(conversation.buyerId), idOf(conversation.sellerId)].includes(String(userId));
  if (!isParticipant && !(await isPrivileged(userId, role))) {
    throw httpError(403, 'Bạn không có quyền truy cập cuộc trò chuyện này');
  }
  return conversation;
}

// Cap nhat nguyen tu thay vi method cua model: method so sanh buyerId.toString()
// nen sai khi conversation da populate.
function unreadField(conversation, userId) {
  if (idOf(conversation.buyerId) === String(userId)) return 'buyerUnreadCount';
  if (idOf(conversation.sellerId) === String(userId)) return 'sellerUnreadCount';
  return null;
}

async function resetUnread(conversation, userId) {
  await Message.markAllAsRead(conversation._id, userId);
  const field = unreadField(conversation, userId);
  if (field) await Conversation.updateOne({ _id: conversation._id }, { $set: { [field]: 0 } });
}

async function markMessagesAsRead(conversationId, userId, role) {
  const conversation = await getConversationById(conversationId, userId, role);
  await resetUnread(conversation, userId);
  return { conversationId: String(conversation._id) };
}

/**
 * Lich su tin nhan phan trang (cu nhat truoc). Doc lich su = danh dau da doc.
 */
async function getMessages(conversationId, userId, query = {}, role) {
  const conversation = await getConversationById(conversationId, userId, role);
  const { page, limit, skip } = pagination({ limit: 50, ...query });
  const [messages, total] = await Promise.all([
    Message.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('senderId', PARTY_FIELDS),
    Message.countDocuments({ conversationId: conversation._id })
  ]);
  await resetUnread(conversation, userId);
  return {
    messages: messages.reverse().map(toClientMessage),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

function normalizePayload(payload) {
  const isObject = payload && typeof payload === 'object';
  const type = isObject ? (payload.type || 'text') : 'text';
  const content = String((isObject ? payload.content : payload) || '').trim();
  const metadata = isObject ? (payload.metadata || null) : null;

  if (!MESSAGE_TYPES.includes(type)) throw httpError(400, 'Loại tin nhắn không hợp lệ');
  if (type === 'text') {
    if (!content) throw httpError(400, 'Nội dung tin nhắn không được để trống');
    if (content.length > MAX_TEXT_LENGTH) throw httpError(400, 'Tin nhắn không được vượt quá 1000 ký tự');
    return { type, content, metadata: null };
  }
  if (typeof metadata?.imageUrl !== 'string' || !metadata.imageUrl.trim()) {
    throw httpError(400, 'Thiếu đường dẫn ảnh để gửi');
  }
  if (content.length > MAX_CAPTION_LENGTH) throw httpError(400, 'Chú thích ảnh không được vượt quá 500 ký tự');
  return { type, content: content || 'Đã gửi một ảnh', metadata: { imageUrl: metadata.imageUrl.trim() } };
}

/**
 * Gui tin nhan: chi luu ciphertext (AES-256-GCM) trong DB, tang unread cho ben con lai.
 */
async function sendMessage(conversationId, senderId, payload, role) {
  const { type, content, metadata } = normalizePayload(payload);
  const conversation = await getConversationById(conversationId, senderId, role);
  if (conversation.status !== 'active') throw httpError(409, 'Cuộc trò chuyện không còn hoạt động');

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    content: encryptChatContent(content),
    type,
    metadata
  });

  const buyerId = idOf(conversation.buyerId);
  const sellerId = idOf(conversation.sellerId);
  const senderField = unreadField(conversation, senderId);
  // Moderator/admin gui tin: ca hai ben deu co tin chua doc.
  const increments = senderField === 'buyerUnreadCount' ? { sellerUnreadCount: 1 }
    : senderField === 'sellerUnreadCount' ? { buyerUnreadCount: 1 }
      : { buyerUnreadCount: 1, sellerUnreadCount: 1 };
  await Conversation.updateOne({ _id: conversation._id }, {
    $set: { lastMessage: (type === 'image' ? '📷 Hình ảnh' : content).substring(0, 200), lastMessageAt: new Date() },
    $inc: increments
  });

  await message.populate('senderId', PARTY_FIELDS);
  return { message: toClientMessage(message), recipients: [buyerId, sellerId].filter(id => id !== String(senderId)) };
}

module.exports = {
  openProductConversation,
  openOrderConversation,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  toClientMessage
};
