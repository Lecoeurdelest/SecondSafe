import React from 'react';
import { Button } from 'antd';
import { Moon, Sun } from '@phosphor-icons/react';

export default function ThemeToggle({ theme, onToggle, language = 'vi' }) {
  const dark = theme === 'dark';
  const label = language === 'en'
    ? (dark ? 'Switch to light mode' : 'Switch to dark mode')
    : (dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
  return (
    <Button
      type="text"
      shape="circle"
      size="small"
      className="theme-toggle"
      aria-pressed={dark}
      aria-label={label}
      title={label}
      icon={dark ? <Sun weight="fill" /> : <Moon weight="fill" />}
      onClick={onToggle}
    />
  );
}
