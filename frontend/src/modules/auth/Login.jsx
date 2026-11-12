import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Divider, Form, Input } from 'antd';
import { GoogleLogo } from '@phosphor-icons/react';
import authService from '../../services/auth.service';
import { saveSession } from '../../services/session.service';
import AuthShell from './AuthShell';
import PasswordField from './PasswordField';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  function finishLogin(result) {
    saveSession(result);
    navigate(result.user.role === 'admin' ? '/admin' : result.user.role === 'moderator' ? '/staff' : '/');
  }

  async function signIn(values = credentials) {
    setError('');
    setLoading(true);
    try {
      const result = await authService.login(values);
      setCredentials(values);
      if (result.requires2FA) setVerificationEmail(result.email || values.email);
      else finishLogin(result);
    } catch (failure) {
      setError(failure.message || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode({ code }) {
    setError('');
    setLoading(true);
    try {
      finishLogin(await authService.verifyLogin2FA(verificationEmail, code));
    } catch (failure) {
      setError(failure.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    setError('');
    setLoading(true);
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('../../config/firebase');
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      finishLogin(await authService.loginWithGoogle(await credential.user.getIdToken()));
    } catch (failure) {
      setError(failure.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Đăng nhập"
      intro="Đăng nhập để mua hàng và quản lý tài khoản SecondSafe."
      error={error}
      footer={[<Link key="forgot" to="/forgot-password">Quên mật khẩu?</Link>, <Link key="register" to="/register">Tạo tài khoản</Link>]}
    >
      {!verificationEmail ? (
        <>
          <Form name="login" layout="vertical" requiredMark={false} onFinish={signIn}>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
              <Input type="email" autoComplete="email" />
            </Form.Item>
            <PasswordField name="password" label="Mật khẩu" autoComplete="current-password" />
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form>
          <Divider plain>hoặc</Divider>
          <Button size="large" block icon={<GoogleLogo weight="bold" />} disabled={loading} onClick={googleLogin}>Đăng nhập với Google</Button>
        </>
      ) : (
        <Form name="login-code" layout="vertical" requiredMark={false} onFinish={verifyCode}>
          <p>Mã xác thực đã được gửi tới {verificationEmail}.</p>
          <Form.Item name="code" label="Mã xác thực 6 chữ số" rules={[{ required: true, message: 'Vui lòng nhập mã xác thực.' }, { pattern: /^[0-9]{6}$/, message: 'Mã gồm 6 chữ số.' }]}>
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>Xác thực đăng nhập</Button>
          <Button size="large" block disabled={loading} style={{ marginTop: 12 }} onClick={() => signIn()}>Gửi lại mã</Button>
        </Form>
      )}
    </AuthShell>
  );
}
