import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { saveSession } from '../../services/session.service';
import PasswordField from './PasswordField';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState('details');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function requestCode(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await authService.requestRegistrationCode(form);
      setStep('verify');
      setNotice('Mã xác thực đã được gửi đến email của bạn.');
    } catch (failure) {
      setError(failure.message || 'Không thể gửi mã xác thực.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyRegistration({ email: form.email, code });
      saveSession(result);
      navigate('/');
    } catch (failure) {
      setError(failure.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Đăng ký</h1>
        <p className="auth-card__intro">
          {step === 'details' ? 'Tạo tài khoản để bắt đầu mua bán an toàn.' : `Nhập mã đã gửi tới ${form.email}.`}
        </p>
        {notice && <p className="auth-feedback" role="status">{notice}</p>}
        {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
        {step === 'details' ? (
          <form className="auth-form" onSubmit={requestCode}>
            <label className="auth-field" htmlFor="register-name">
              Họ và tên
              <input id="register-name" name="fullName" autoComplete="name" required maxLength="100" value={form.fullName} onChange={updateField} />
            </label>
            <label className="auth-field" htmlFor="register-email">
              Email
              <input id="register-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={updateField} />
            </label>
            <label className="auth-field" htmlFor="register-phone">
              Số điện thoại
              <input id="register-phone" name="phone" type="tel" autoComplete="tel" required pattern="0[0-9]{9,10}" value={form.phone} onChange={updateField} />
            </label>
            <PasswordField
              id="register-password"
              name="password"
              label="Mật khẩu"
              autoComplete="new-password"
              required
              minLength="8"
              value={form.password}
              onChange={updateField}
            />
            <p className="auth-policy">Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verifyCode}>
            <label className="auth-field" htmlFor="register-code">
              Mã xác thực 6 chữ số
              <input id="register-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" required value={code} onChange={event => setCode(event.target.value)} />
            </label>
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang xác thực...' : 'Xác nhận đăng ký'}</button>
            <button type="button" className="auth-submit auth-submit--secondary" disabled={loading} onClick={requestCode}>Gửi lại mã xác thực</button>
            <button type="button" className="auth-submit auth-submit--secondary" disabled={loading} onClick={() => setStep('details')}>Sửa thông tin đăng ký</button>
          </form>
        )}
        <div className="auth-links"><Link to="/login">Đã có tài khoản? Đăng nhập</Link></div>
      </div>
    </section>
  );
}
