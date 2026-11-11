import api from './api';

const supportService = {
  getConversations: async (status, page = 1) =>
    (await api.get('/support/conversations', { params: { status, page, limit: 50 } })).data.data,
  createConversation: async ({ subject, message }) =>
    (await api.post('/support/conversations', { subject, message })).data.data,
  getMessages: async conversationId =>
    (await api.get(`/support/conversations/${conversationId}/messages`)).data.data,
  sendMessage: async (conversationId, content) =>
    (await api.post(`/support/conversations/${conversationId}/messages`, { content })).data.data,
  updateStatus: async (conversationId, status) =>
    (await api.patch(`/support/conversations/${conversationId}/status`, { status })).data.data
};

export default supportService;
