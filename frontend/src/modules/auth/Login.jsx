import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { saveSession } from '../../services/session.service';
import PasswordField from './PasswordField';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [code, setCode] = useState('');

  function finishLogin(result) {
    saveSession(result);
    navigate(result.user.role === 'admin' ? '/admin' : result.user.role === 'moderator' ? '/staff' : '/');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.login({ email, password });
      if (result.requires2FA) setVerificationEmail(result.email || email);
      else finishLogin(result);
    } catch (failure) {
      setError(failure.message || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
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
    <section className="auth-page">
      <div className="auth-card">
        <h1>Đăng nhập</h1>
        <p className="auth-card__intro">Đăng nhập để mua hàng và quản lý tài khoản SecondSafe.</p>
        {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
        {!verificationEmail ? <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field" htmlFor="login-email">
            Email
            <input id="login-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <PasswordField
            id="login-password"
            label="Mật khẩu"
            autoComplete="current-password"
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form> : <form className="auth-form" onSubmit={verifyCode}>
          <p>Mã xác thực đã được gửi tới {verificationEmail}.</p>
          <label className="auth-field" htmlFor="login-code">Mã xác thực 6 chữ số
            <input id="login-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" required value={code} onChange={event => setCode(event.target.value)} />
          </label>
          <button className="auth-submit" type="submit" disabled={loading}>Xác thực đăng nhập</button>
          <button className="auth-submit auth-submit--secondary" type="button" disabled={loading} onClick={handleSubmit}>Gửi lại mã</button>
        </form>}
        {!verificationEmail && <button className="auth-submit auth-submit--secondary" type="button" disabled={loading} onClick={googleLogin}>Đăng nhập với Google</button>}
        <div className="auth-links">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Tạo tài khoản</Link>
        </div>
      </div>
    </section>
  );
}
