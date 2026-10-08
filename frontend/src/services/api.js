import axios from 'axios';
import { NETWORK_CONFIG } from './network.config';

function errorMessage(error) {
  const raw = error.response?.data?.message;
  if (!error.response) return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
  if (!raw || typeof raw !== 'string') return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  if (/invalid login|authentication unsuccessful|535 5\.7\.3/i.test(raw)) return 'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.';
  if (/esocket|econnection|etimedout|connection timeout/i.test(raw)) return 'Không thể kết nối đến dịch vụ email lúc này. Vui lòng thử lại sau.';
  return raw;
}

function sessionToken(storage) {
  try { return storage.getItem('token'); } catch { return null; }
}

function browserStorage() {
  try { return window.localStorage; } catch { return { getItem: () => null, removeItem: () => {} }; }
}

export function createApiClient({ storage = browserStorage(), onUnauthorized, adapter } = {}) {
  const expired = onUnauthorized || (() => window.dispatchEvent(new Event('secondsafe:session-expired')));
  const client = axios.create({ baseURL: NETWORK_CONFIG.API_BASE_URL, timeout: 15000, ...(adapter ? { adapter } : {}) });
  client.interceptors.request.use(config => {
    const token = sessionToken(storage);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(response => response, error => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
      try { storage.removeItem('token'); } catch { /* Storage can be unavailable in private browsing. */ }
      expired();
    }
    const failure = new Error(errorMessage(error));
    failure.status = error.response?.status;
    failure.code = error.code;
    failure.errors = error.response?.data?.errors;
    return Promise.reject(failure);
  });
  return client;
}

export default createApiClient();
