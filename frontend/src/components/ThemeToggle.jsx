import React from 'react';

export default function ThemeToggle({ theme, onToggle, language = 'vi' }) {
  const dark = theme === 'dark';
  const label = language === 'en'
    ? (dark ? 'Switch to light mode' : 'Switch to dark mode')
    : (dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
  return (
    <button type="button" className="theme-toggle" aria-pressed={dark} aria-label={label} title={label} onClick={onToggle}>
      <span aria-hidden="true">{dark ? '☀' : '☾'}</span>
    </button>
  );
}
