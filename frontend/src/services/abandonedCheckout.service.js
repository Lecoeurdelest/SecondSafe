import api from './api';

async function getMine() {
  const response = await api.get('/abandoned-checkouts');
  return response.data.data || [];
}

async function dismiss(id) {
  const response = await api.post(`/abandoned-checkouts/${id}/dismiss`);
  return response.data.data;
}

async function getSummary(params = {}) {
  const response = await api.get('/abandoned-checkouts/summary', { params });
  return response.data.data;
}

const abandonedCheckoutService = { getMine, dismiss, getSummary };

export default abandonedCheckoutService;
