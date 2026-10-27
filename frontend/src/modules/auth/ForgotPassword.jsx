import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/auth.service';
import PasswordField from './PasswordField';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('request');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestRecovery(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.forgotPassword({ email });
      setNotice(result.message || 'Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư.');
      setStep('reset');
    } catch (failure) {
      setError(failure.message || 'Không thể gửi yêu cầu khôi phục.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
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
    <section className="auth-page">
      <div className="auth-card">
        <h1>Khôi phục mật khẩu</h1>
        {notice && <p className="auth-feedback" role="status">{notice}</p>}
        {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
        {step === 'request' && (
          <form className="auth-form" onSubmit={requestRecovery}>
            <p className="auth-card__intro">Nhập email tài khoản để nhận liên kết/mã khôi phục.</p>
            <label className="auth-field" htmlFor="recovery-email">
              Email
              <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
            </label>
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi hướng dẫn khôi phục'}</button>
          </form>
        )}
        {step === 'reset' && (
          <form className="auth-form" onSubmit={resetPassword}>
            <p className="auth-card__intro">Nếu email tồn tại, hãy dùng mã khôi phục trong hộp thư. Mã hết hạn sau tối đa một giờ.</p>
            <label className="auth-field" htmlFor="recovery-token">
              Mã khôi phục
              <input id="recovery-token" autoComplete="one-time-code" required value={token} onChange={event => setToken(event.target.value)} />
            </label>
            <PasswordField
              id="recovery-password"
              label="Mật khẩu mới"
              autoComplete="new-password"
              minLength="8"
              required
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
            />
            <p className="auth-policy">Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</button>
          </form>
        )}
        {step === 'complete' && <Link className="auth-submit" to="/login">Đến trang đăng nhập</Link>}
        {step !== 'complete' && <div className="auth-links"><Link to="/login">Quay lại đăng nhập</Link></div>}
      </div>
    </section>
  );
}
