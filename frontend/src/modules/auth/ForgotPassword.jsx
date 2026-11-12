import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, Input, Typography } from 'antd';
import authService from '../../services/auth.service';
import LinkButton from '../../ui/LinkButton';
import AuthShell from './AuthShell';
import PasswordField from './PasswordField';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestRecovery(values) {
    setError('');
    setLoading(true);
    try {
      const result = await authService.forgotPassword({ email: values.email });
      setEmail(values.email);
      setNotice(result.message || 'Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư.');
      setStep('reset');
    } catch (failure) {
      setError(failure.message || 'Không thể gửi yêu cầu khôi phục.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword({ token, newPassword }) {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword });
      setNotice('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
      setStep('complete');
    } catch (failure) {
      setError(failure.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Khôi phục mật khẩu"
      notice={notice}
      error={error}
      footer={step !== 'complete' ? <Link to="/login">Quay lại đăng nhập</Link> : null}
    >
      {step === 'request' && (
        <Form name="recovery" layout="vertical" requiredMark={false} onFinish={requestRecovery}>
          <Typography.Paragraph type="secondary">Nhập email tài khoản để nhận liên kết/mã khôi phục.</Typography.Paragraph>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
            <Input type="email" autoComplete="email" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>{loading ? 'Đang gửi...' : 'Gửi hướng dẫn khôi phục'}</Button>
        </Form>
      )}
      {step === 'reset' && (
        <Form name="recovery-reset" layout="vertical" requiredMark={false} onFinish={resetPassword}>
          <Typography.Paragraph type="secondary">Nếu email tồn tại, hãy dùng mã khôi phục trong hộp thư. Mã hết hạn sau tối đa một giờ.</Typography.Paragraph>
          <Form.Item name="token" label="Mã khôi phục" rules={[{ required: true, message: 'Vui lòng nhập mã khôi phục.' }]}>
            <Input autoComplete="one-time-code" />
          </Form.Item>
          <PasswordField name="newPassword" label="Mật khẩu mới" autoComplete="new-password" minLength="8" />
          <Typography.Paragraph type="secondary">Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</Typography.Paragraph>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>{loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</Button>
        </Form>
      )}
      {step === 'complete' && <LinkButton type="primary" size="large" block to="/login">Đến trang đăng nhập</LinkButton>}
    </AuthShell>
  );
}
