import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, useLocation } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppRoutes from './routes';
import authService from './services/auth.service';
import { clearSession, getSession } from './services/session.service';

const NotificationPanel = lazy(() => import('./components/NotificationPanel'));

function PageContent() {
  const { pathname } = useLocation();
  const hasInnerMain = pathname === '/admin/users' || pathname === '/moderator' || pathname === '/moderator/profile';
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
        <header className="site-header"><div className="container site-header__content">
          <Link className="site-brand" to="/" aria-label="SecondSafe — Trang chủ">SecondSafe</Link>
          <nav className="site-header__links" aria-label="Điều hướng chính">
            <Link to="/favorites">Yêu thích</Link>
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/assistant">Trợ lý AI</Link>
            <Link to="/support">Hỗ trợ</Link>
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
            {adminRole && <><Link to="/admin">Dashboard</Link><Link to="/admin/users">Quản lý người dùng</Link></>}
            {staffRole && <Link to="/staff">Dashboard nhân viên</Link>}
            {isAuthenticated ? (
              <>
                <Link to="/change-password">Đổi mật khẩu</Link>
                <button type="button" className="site-header__logout" onClick={handleLogout}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login">Đăng nhập</Link>
                <Link to="/register">Đăng ký</Link>
              </>
            )}
          </nav>
        </div></header>
        {logoutError && <p className="site-header__error" role="alert">{logoutError}</p>}
        <PageContent />
        <footer className="site-footer"><div className="container">SecondSafe · Trao đồ cũ, nhận giá trị mới.</div></footer>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
