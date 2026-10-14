import { io } from 'socket.io-client';
import api from './api';
import { NETWORK_CONFIG } from './network.config';

// Ket noi realtime; token dung chung voi API client (localStorage 'token').
export function connectChatSocket(token) {
  return io(NETWORK_CONFIG.SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
}

const chatService = {
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

  // REST fallback khi socket mat ket noi.
  sendMessage: async (conversationId, content) =>
    (await api.post('/chat/messages', { conversationId, content })).data.data
};

export default chatService;
