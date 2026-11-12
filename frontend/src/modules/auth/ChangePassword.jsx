import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Typography } from 'antd';
import authService from '../../services/auth.service';
import LinkButton from '../../ui/LinkButton';
import AuthShell from './AuthShell';
import PasswordField from './PasswordField';

function hasSession() {
  try {
    return Boolean(window.localStorage.getItem('token'));
  } catch {
    return false;
  }
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [authenticated, setAuthenticated] = useState(hasSession);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateSession = () => setAuthenticated(hasSession());
    window.addEventListener('secondsafe:session-changed', updateSession);
    window.addEventListener('secondsafe:session-expired', updateSession);
    window.addEventListener('storage', updateSession);
    return () => {
      window.removeEventListener('secondsafe:session-changed', updateSession);
      window.removeEventListener('secondsafe:session-expired', updateSession);
      window.removeEventListener('storage', updateSession);
    };
  }, []);

  async function handleSubmit({ currentPassword, newPassword }) {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const result = await authService.changePassword({ currentPassword, newPassword });
      setNotice(result.message || 'Đổi mật khẩu thành công.');
      form.resetFields();
    } catch (failure) {
      setError(failure.message || 'Không thể đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <AuthShell title="Đổi mật khẩu">
        <Typography.Paragraph>Vui lòng đăng nhập để đổi mật khẩu.</Typography.Paragraph>
        <LinkButton type="primary" to="/login">Đăng nhập</LinkButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Đổi mật khẩu"
      intro="Xác nhận mật khẩu hiện tại trước khi thiết lập mật khẩu mới."
      notice={notice}
      error={error}
      footer={<Button type="link" onClick={() => navigate('/')}>Về trang chủ</Button>}
    >
      <Form form={form} name="change-password" layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        <PasswordField name="currentPassword" label="Mật khẩu hiện tại" autoComplete="current-password" />
        <PasswordField name="newPassword" label="Mật khẩu mới" autoComplete="new-password" minLength="8" />
        <Typography.Paragraph type="secondary">Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</Typography.Paragraph>
        <Button type="primary" htmlType="submit" size="large" block loading={loading}>{loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</Button>
      </Form>
    </AuthShell>
  );
}
