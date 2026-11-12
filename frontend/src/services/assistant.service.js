import api from './api';

const assistantService = {
  ask: async ({ message, mode }) =>
    (await api.post('/assistant/ask', { message, mode })).data.data,
  chat: async ({ messages }) =>
    (await api.post('/assistant/chat', { messages })).data.data,
  getModerationGuidance: async reportId =>
    (await api.post(`/assistant/moderation/reports/${reportId}/guidance`)).data.data
};

export default assistantService;
