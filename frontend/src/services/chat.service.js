import { io } from 'socket.io-client';
import api from './api';
import { NETWORK_CONFIG } from './network.config';

// Ket noi realtime; token dung chung voi API client (localStorage 'token').
export function connectChatSocket(token) {
  return io(NETWORK_CONFIG.SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
}

const chatService = {
  connectSocket: connectChatSocket,

  getConversations: async (page = 1, limit = 20) =>
    (await api.get('/chat/conversations', { params: { page, limit } })).data.data,

  getConversationById: async conversationId =>
    (await api.get(`/chat/conversations/${conversationId}`)).data.data,

  getMessages: async (conversationId, page = 1, limit = 50) =>
    (await api.get(`/chat/conversations/${conversationId}/messages`, { params: { page, limit } })).data.data,

  // Mo (hoac lay lai) cuoc tro chuyen voi nguoi ban ve mot san pham.
  openConversation: async (sellerId, productId) =>
    (await api.post('/chat/conversations', { sellerId, productId })).data.data,

  openOrderConversation: async orderId =>
    (await api.post(`/chat/orders/${orderId}/conversation`)).data.data,

  markAsRead: async conversationId =>
    (await api.patch(`/chat/conversations/${conversationId}/read`)).data.data,

  // REST fallback khi socket mat ket noi; payload la chuoi (text) hoac { content, type, metadata }.
  sendMessage: async (conversationId, payload) =>
    (await api.post('/chat/messages', { conversationId, ...(typeof payload === 'string' ? { content: payload } : payload) })).data.data,

  // De nghi gia trong chat (API cua module orders): nguoi ban -> seller-offer, nguoi mua -> buyer-offer.
  createOffer: async ({ conversationId, agreedPrice, message, asSeller }) =>
    (await api.post(asSeller ? '/orders/seller-offer' : '/orders/buyer-offer', { conversationId, agreedPrice, message })).data.data,

  // Ben nhan de nghi chap nhan (tao don hang) hoac tu choi.
  respondToOffer: async (purchaseRequestId, accept, reason = '') =>
    (await api.post(`/orders/${purchaseRequestId}/${accept ? 'accept' : 'reject'}`, accept ? undefined : { reason })).data.data,

  // Upload anh vao cuoc tro chuyen; tra ve { imageUrl } de gui tin nhan type image.
  uploadImage: async (conversationId, file) => {
    const form = new FormData();
    form.append('image', file);
    return (await api.post(`/chat/conversations/${conversationId}/images`, form)).data.data;
  }
};

// Anh luu tren backend duoi /uploads; frontend chay o origin khac nen can ghep origin API.
export function chatImageUrl(imageUrl) {
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : `${NETWORK_CONFIG.API_ORIGIN}${imageUrl}`;
}

export default chatService;
