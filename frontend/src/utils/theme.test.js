import { applyTheme, canChooseTheme, effectiveTheme, getStoredTheme, preferredTheme, savePreferredTheme, systemTheme } from './theme';

function mockSystemTheme(dark) {
  window.matchMedia = jest.fn().mockReturnValue({ matches: dark });
}

afterEach(() => {
  delete window.matchMedia;
  window.localStorage.removeItem('secondsafe:theme');
  document.documentElement.removeAttribute('data-theme');
});

test('follows the system preference until the visitor chooses', () => {
  mockSystemTheme(true);
  expect(systemTheme()).toBe('dark');
  expect(preferredTheme()).toBe('dark');
  savePreferredTheme('light');
  expect(getStoredTheme()).toBe('light');
  expect(preferredTheme()).toBe('light');
});

test('falls back to light when the browser cannot report a preference or has odd stored data', () => {
  expect(systemTheme()).toBe('light');
  window.localStorage.setItem('secondsafe:theme', 'sepia');
  expect(getStoredTheme()).toBeNull();
  expect(preferredTheme()).toBe('light');
});

test('staff roles are always light and cannot choose a theme', () => {
  expect(effectiveTheme('admin', 'dark')).toBe('light');
  expect(effectiveTheme('moderator', 'dark')).toBe('light');
  expect(effectiveTheme('user', 'dark')).toBe('dark');
  expect(effectiveTheme(null, 'dark')).toBe('dark');
  expect(canChooseTheme('admin')).toBe(false);
  expect(canChooseTheme('moderator')).toBe(false);
  expect(canChooseTheme('user')).toBe(true);
  expect(canChooseTheme(null)).toBe(true);
});

test('applyTheme writes the attribute the stylesheets read', () => {
  applyTheme('dark');
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
});
