import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Typography } from 'antd';
import authService from '../../services/auth.service';
import { saveSession } from '../../services/session.service';
import AuthShell from './AuthShell';
import PasswordField from './PasswordField';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState('details');
  const [details, setDetails] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(values = details) {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await authService.requestRegistrationCode(values);
      setDetails(values);
      setStep('verify');
      setNotice('Mã xác thực đã được gửi đến email của bạn.');
    } catch (failure) {
      setError(failure.message || 'Không thể gửi mã xác thực.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode({ code }) {
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyRegistration({ email: details.email, code });
      saveSession(result);
      navigate('/');
    } catch (failure) {
      setError(failure.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Đăng ký"
      intro={step === 'details' ? 'Tạo tài khoản để bắt đầu mua bán an toàn.' : `Nhập mã đã gửi tới ${details.email}.`}
      notice={notice}
      error={error}
      footer={<Link to="/login">Đã có tài khoản? Đăng nhập</Link>}
    >
      {step === 'details' ? (
        <Form name="register" layout="vertical" requiredMark={false} initialValues={details} onFinish={requestCode}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ và tên.' }]}>
            <Input autoComplete="name" maxLength={100} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
            <Input type="email" autoComplete="email" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại.' }, { pattern: /^0[0-9]{9,10}$/, message: 'Số điện thoại gồm 10 hoặc 11 chữ số, bắt đầu bằng 0.' }]}>
            <Input type="tel" autoComplete="tel" />
          </Form.Item>
          <PasswordField name="password" label="Mật khẩu" autoComplete="new-password" minLength="8" />
          <Typography.Paragraph type="secondary">Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</Typography.Paragraph>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>{loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}</Button>
        </Form>
      ) : (
        <Form name="register-code" layout="vertical" requiredMark={false} onFinish={verifyCode}>
          <Form.Item name="code" label="Mã xác thực 6 chữ số" rules={[{ required: true, message: 'Vui lòng nhập mã xác thực.' }, { pattern: /^[0-9]{6}$/, message: 'Mã gồm 6 chữ số.' }]}>
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>{loading ? 'Đang xác thực...' : 'Xác nhận đăng ký'}</Button>
          <Button size="large" block disabled={loading} style={{ marginTop: 12 }} onClick={() => requestCode()}>Gửi lại mã xác thực</Button>
          <Button size="large" block disabled={loading} style={{ marginTop: 12 }} onClick={() => setStep('details')}>Sửa thông tin đăng ký</Button>
        </Form>
      )}
    </AuthShell>
  );
}
