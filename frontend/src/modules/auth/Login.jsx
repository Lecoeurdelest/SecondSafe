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

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.login({ email, password });
      saveSession(result);
      navigate(result.user.role === 'admin' ? '/admin' : result.user.role === 'moderator' ? '/staff' : '/');
    } catch (failure) {
      setError(failure.message || 'Không thể đăng nhập. Vui lòng thử lại.');
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
        <form className="auth-form" onSubmit={handleSubmit}>
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
        </form>
        <div className="auth-links">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Tạo tài khoản</Link>
        </div>
      </div>
    </section>
  );
}
