import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import Home from './modules/home/Home';
import Assistant from './modules/assistant/Assistant';
import Support from './modules/support/Support';
import authService from './services/auth.service';
import { clearSession, getSession } from './services/session.service';

const Chat = lazy(() => import('./modules/chat/Chat'));
const ProductDetail = lazy(() => import('./modules/product/ProductDetail'));
const Cart = lazy(() => import('./modules/product/Cart'));
const Favorites = lazy(() => import('./modules/product/Favorites'));
const Login = lazy(() => import('./modules/auth/Login'));
const Register = lazy(() => import('./modules/auth/Register'));
const ForgotPassword = lazy(() => import('./modules/auth/ForgotPassword'));
const ChangePassword = lazy(() => import('./modules/auth/ChangePassword'));
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));

function NotFound() {
  return <section className="welcome"><h1>Không tìm thấy trang</h1><p>Trang bạn đang tìm không tồn tại.</p><Link to="/">Về trang chủ</Link></section>;
}

function DashboardRoute({ role, children }) {
  const session = getSession();
  if (!session.token) return <Navigate to="/login" replace />;
  const allowed = session.role === role || (role === 'moderator' && session.role === 'admin');
  if (!allowed) {
    return <section className="welcome"><h1>Không có quyền truy cập</h1><p>Tài khoản này không được phép mở dashboard này.</p><Link to="/">Về trang chủ</Link></section>;
  }
  return children;
}

export default function App() {
  const [session, setSession] = useState(getSession);
  const [logoutError, setLogoutError] = useState('');

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
            {isAuthenticated && <Link to="/chat">Tin nhắn</Link>}
            {adminRole && <Link to="/admin">Dashboard</Link>}
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
        <main id="main-content" tabIndex="-1">
          <Suspense fallback={<p role="status">Đang tải...</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/admin" element={<DashboardRoute role="admin"><Dashboard role="admin" /></DashboardRoute>} />
              <Route path="/staff" element={<DashboardRoute role="moderator"><Dashboard role="moderator" /></DashboardRoute>} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/assistant/reports/:reportId" element={<DashboardRoute role="moderator"><Assistant moderation /></DashboardRoute>} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/:conversationId" element={<Support />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="site-footer"><div className="container">SecondSafe · Trao đồ cũ, nhận giá trị mới.</div></footer>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
