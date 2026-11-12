import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';

export default function PasswordField({ name, label, autoComplete, minLength, rules = [] }) {
  const [visible, setVisible] = useState(false);
  const lengthRule = minLength ? [{ min: Number(minLength), message: `Mật khẩu cần ít nhất ${minLength} ký tự.` }] : [];

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: true, message: `Vui lòng nhập ${label.toLowerCase()}.` }, ...lengthRule, ...rules]}
    >
      <Input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        suffix={(
          <Button
            type="text"
            size="small"
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
            onClick={() => setVisible(current => !current)}
          >
            {visible ? 'Ẩn' : 'Hiện'}
          </Button>
        )}
      />
    </Form.Item>
  );
}
