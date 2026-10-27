import React, { useState } from 'react';

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  required = false
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-control">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          value={value}
          onChange={onChange}
        />
        <button
          className="auth-password-toggle"
          type="button"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          onClick={() => setVisible(current => !current)}
        >
          {visible ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
    </div>
  );
}
