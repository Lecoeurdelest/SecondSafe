import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, useLocation } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppRoutes from './routes';
import authService from './services/auth.service';
import { clearSession, getSession } from './services/session.service';
import LanguageSwitcher from './components/LanguageSwitcher';
import { applySystemLanguage, observeSystemLanguage } from './services/language.service';

const NotificationPanel = lazy(() => import('./components/NotificationPanel'));

function PageContent() {
  const { pathname } = useLocation();
  // Staff layouts render their own <main>; the standalone dashboards do not.
  const staffArea = /^\/(admin|moderator)(\/|$)/.test(pathname);
  const hasInnerMain = staffArea && !['/admin', '/admin/dashboard', '/moderator/dashboard'].includes(pathname);
  const Content = hasInnerMain ? 'div' : 'main';
  return <Content id="main-content" tabIndex="-1">
    <Suspense fallback={<p role="status">Đang tải...</p>}><AppRoutes /></Suspense>
  </Content>;
}

export default function App() {
  const [session, setSession] = useState(getSession);
  const [logoutError, setLogoutError] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try { return window.localStorage.getItem('secondsafe:language') === 'en' ? 'en' : 'vi'; }
    catch { return 'vi'; }
  });

  useEffect(() => {
    try { window.localStorage.setItem('secondsafe:language', language); } catch { /* Storage can be unavailable in private browsing. */ }
    applySystemLanguage(language);
    window.dispatchEvent(new CustomEvent('secondsafe:language-changed', { detail: { language } }));
    return observeSystemLanguage(language);
  }, [language]);

  useEffect(() => {
    const updateSession = () => setSession(getSession());
    window.addEventListener('secondsafe:session-changed', updateSession);
    window.addEventListener('secondsafe:session-expired', updateSession);
    window.addEventListener('storage', updateSession);
    return () => {
      window.removeEventListener('secondsafe:session-changed', updateSession);
      window.removeEventListener('secondsafe:session-expired', updateSession);
      window.removeEventListener('storage', updateSession);
    };
  }, []);

  async function handleLogout() {
    setLogoutError('');
    try {
      await authService.logout();
    } catch (failure) {
      setLogoutError(failure.message || 'Không thể xác nhận đăng xuất với máy chủ.');
    } finally {
      try {
        clearSession();
      } catch (failure) {
        setLogoutError(failure.message);
      }
      setSession(getSession());
      setNotificationsOpen(false);
    }
  }

  const isAuthenticated = Boolean(session.token);
  const adminRole = session.role === 'admin';
  const staffRole = session.role === 'moderator';

  return (
    <AppErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <a className="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
        <div className="marketplace-announcement" role="status">
          <div className="container marketplace-announcement__content">
            <span>{language === 'en' ? 'SecondSafe · Safe, transparent second-hand marketplace' : 'SecondSafe · Mua đồ đã qua sử dụng, chọn lọc và trao đổi minh bạch'}</span>
            <button type="button" className="marketplace-announcement__support" onClick={() => setSupportOpen(true)}>{language === 'en' ? 'Help center' : 'Trung tâm hỗ trợ'}</button>
            <LanguageSwitcher value={language} onChange={setLanguage} />
          </div>
        </div>
        <header className="site-header"><div className="container site-header__content">
          <Link className="site-brand" to="/" aria-label="SecondSafe — Trang chủ">
            <span className="site-brand__mark" aria-hidden="true">S</span>
            <span>SecondSafe</span>
          </Link>
          <nav className="site-header__links" aria-label="Điều hướng chính">
            <Link to="/favorites">Yêu thích</Link>
            <Link className="site-header__cart" to="/cart" aria-label="Giỏ hàng">🛒<span>Giỏ hàng</span></Link>
            <Link to="/assistant">Trợ lý AI</Link>
            <Link to="/support">Hỗ trợ</Link>
            {isAuthenticated && !adminRole && !staffRole && <>
              <Link className="site-header__sell" to="/product/create">Đăng tin</Link>
              <Link to="/my-products">Tin của tôi</Link>
              <Link to="/orders">Đơn mua</Link>
              <Link to="/seller-orders">Đơn bán</Link>
              <Link to="/wallet">Ví</Link>
            </>}
            {isAuthenticated && <>
              <Link to="/chat">Tin nhắn</Link>
              <Link to="/profile">Hồ sơ</Link>
              <div className="notification-dropdown-wrapper">
                <button type="button" className="site-header__logout" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(open => !open)}>Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ''}</button>
                {notificationsOpen && <Suspense fallback={<p role="status">Đang tải thông báo...</p>}>
                  <NotificationPanel isOpen onClose={() => setNotificationsOpen(false)} onUnreadCountChange={setUnreadCount} />
                </Suspense>}
              </div>
            </>}
            {adminRole && <><Link to="/admin">Dashboard</Link><Link to="/admin/users">Quản lý người dùng</Link><Link to="/admin/reports">Kiểm duyệt</Link></>}
            {staffRole && <><Link to="/staff">Dashboard nhân viên</Link><Link to="/moderator/reports">Kiểm duyệt</Link></>}
            {isAuthenticated ? (
              <>
                <Link to="/change-password">Đổi mật khẩu</Link>
                <button type="button" className="site-header__logout" onClick={handleLogout}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login">Đăng nhập</Link>
                <Link className="site-header__register" to="/register">Đăng ký</Link>
              </>
            )}
          </nav>
        </div></header>
        {logoutError && <p className="site-header__error" role="alert">{logoutError}</p>}
        <PageContent />
        <Link className="floating-chat" to="/support" aria-label="Chat hỗ trợ">
          <span aria-hidden="true">💬</span>
          <strong>Chat</strong>
        </Link>
        {supportOpen && (
          <div className="support-contact-modal" role="dialog" aria-modal="true" aria-labelledby="support-contact-title" onMouseDown={event => { if (event.target === event.currentTarget) setSupportOpen(false); }}>
            <div className="support-contact-modal__card">
              <button type="button" className="support-contact-modal__close" aria-label="Đóng cửa sổ hỗ trợ" onClick={() => setSupportOpen(false)}>×</button>
              <h2 id="support-contact-title">Liên hệ SecondSafe</h2>
              <Link to="/assistant" onClick={() => setSupportOpen(false)}><span aria-hidden="true">✦</span><div><strong>Hỏi trợ lý AI</strong><small>Gợi ý sản phẩm và câu hỏi thường gặp</small></div></Link>
              <Link to="/support" onClick={() => setSupportOpen(false)}><span aria-hidden="true">💬</span><div><strong>Trò chuyện với nhân viên</strong><small>Mở cuộc hỗ trợ trong tài khoản</small></div></Link>
              <Link to="/support" onClick={() => setSupportOpen(false)}><span aria-hidden="true">?</span><div><strong>Trung tâm trợ giúp</strong><small>Xem hướng dẫn sử dụng SecondSafe</small></div></Link>
            </div>
          </div>
        )}
        <footer className="site-footer"><div className="container">SecondSafe · Trao đồ cũ, nhận giá trị mới.</div></footer>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
