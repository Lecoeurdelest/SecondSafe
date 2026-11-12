const THEME_KEY = 'secondsafe:theme';
const STAFF_ROLES = ['admin', 'moderator'];

function storedValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getStoredTheme() {
  const value = storedValue(THEME_KEY);
  return value === 'dark' || value === 'light' ? value : null;
}

export function systemTheme() {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function preferredTheme() {
  return getStoredTheme() || systemTheme();
}

export function effectiveTheme(role, preferred = preferredTheme()) {
  return STAFF_ROLES.includes(role) ? 'light' : preferred;
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function savePreferredTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch { /* Storage can be unavailable in private browsing. */ }
}

export function canChooseTheme(role) {
  return !STAFF_ROLES.includes(role);
}
