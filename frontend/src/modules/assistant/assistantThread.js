const STORAGE_KEY = 'secondsafe:assistant:thread';
const MAX_STORED = 30;
const MAX_SENT = 12;

function isMessage(item) {
  return Boolean(item)
    && (item.role === 'user' || item.role === 'assistant')
    && typeof item.content === 'string'
    && typeof item.id === 'string';
}

export function newMessageId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function loadThread() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(isMessage).slice(-MAX_STORED) : [];
  } catch {
    return [];
  }
}

export function saveThread(messages) {
  try {
    if (messages.length) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Session storage can be unavailable in private browsing. */ }
}

export function toPayload(messages) {
  return messages.slice(-MAX_SENT).map(({ role, content }) => ({ role, content }));
}
