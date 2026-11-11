import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import PasswordField from './PasswordField';
import './Auth.css';

function hasSession() {
  try {
    return Boolean(window.localStorage.getItem('token'));
  } catch {
    return false;
  }
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(hasSession);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const result = await authService.changePassword({ currentPassword, newPassword });
      setNotice(result.message || 'Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (failure) {
      setError(failure.message || 'Không thể đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <h1>Đổi mật khẩu</h1>
          <p>Vui lòng đăng nhập để đổi mật khẩu.</p>
          <Link to="/login">Đăng nhập</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Đổi mật khẩu</h1>
        <p className="auth-card__intro">Xác nhận mật khẩu hiện tại trước khi thiết lập mật khẩu mới.</p>
        {notice && <p className="auth-feedback" role="status">{notice}</p>}
        {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <PasswordField
            id="current-password"
            label="Mật khẩu hiện tại"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
          />
          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            autoComplete="new-password"
            minLength="8"
            required
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
          />
          <p className="auth-policy">Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</button>
        </form>
        <div className="auth-links"><button type="button" onClick={() => navigate('/')}>Về trang chủ</button></div>
      </div>
    </section>
  );
}
