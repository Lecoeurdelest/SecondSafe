import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Flex, FloatButton, Layout, List, Menu, Modal, Popover } from 'antd';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppRoutes from './routes';
import authService from './services/auth.service';
import { clearSession, getSession } from './services/session.service';
import AppProviders from './ui/AppProviders';
import LinkButton from './ui/LinkButton';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeToggle from './components/ThemeToggle';
import { applyTheme, canChooseTheme, effectiveTheme, preferredTheme, savePreferredTheme } from './utils/theme';
import { applySystemLanguage, observeSystemLanguage } from './services/language.service';
import { ChatCircleText, Question, ShoppingCart, Sparkle } from '@phosphor-icons/react';
import './ui/shell.css';

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

function activeKeys(items, pathname) {
  const hit = items.map(item => item.key)
    .filter(key => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? [hit] : [];
}

function NavMenu({ items, className }) {
  const { pathname } = useLocation();
  const menuItems = items.map(({ key, label, icon, ariaLabel }) => ({
    key,
    label: <Link to={key} aria-label={ariaLabel}>{icon}{label}</Link>
  }));
  return <Menu mode="horizontal" className={className} items={menuItems} selectedKeys={activeKeys(menuItems, pathname)} />;
}

function SupportFloatButton() {
  const navigate = useNavigate();
  return (
    <FloatButton
      className="floating-chat"
      type="primary"
      shape="square"
      aria-label="Chat hỗ trợ"
      href="/support"
      icon={<ChatCircleText weight="fill" />}
      content="Chat"
      onClick={event => { event.preventDefault(); navigate('/support'); }}
    />
  );
}

export default function App() {
  const [session, setSession] = useState(getSession);
  const [logoutError, setLogoutError] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const [preferred, setPreferred] = useState(preferredTheme);
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

  const theme = effectiveTheme(session.role, preferred);

  useEffect(() => { applyTheme(theme); }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPreferred(next);
    savePreferredTheme(next);
  }

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
  const english = language === 'en';

  const mainLinks = [
    { key: '/favorites', label: 'Yêu thích' },
    { key: '/cart', label: <span>Giỏ hàng</span>, icon: <ShoppingCart aria-hidden="true" />, ariaLabel: 'Giỏ hàng' },
    { key: '/assistant', label: 'Trợ lý AI' },
    { key: '/support', label: 'Hỗ trợ' }
  ];
  const accountLinks = [
    ...(!adminRole && !staffRole ? [
      { key: '/my-products', label: 'Tin của tôi' },
      { key: '/orders', label: 'Đơn mua' },
      { key: '/seller-orders', label: 'Đơn bán' },
      { key: '/wallet', label: 'Ví' }
    ] : []),
    ...(adminRole ? [
      { key: '/admin', label: 'Dashboard' },
      { key: '/admin/users', label: 'Quản lý người dùng' },
      { key: '/admin/reports', label: 'Kiểm duyệt' }
    ] : []),
    ...(staffRole ? [
      { key: '/staff', label: 'Dashboard nhân viên' },
      { key: '/moderator/reports', label: 'Kiểm duyệt' }
    ] : []),
    { key: '/chat', label: 'Tin nhắn' },
    { key: '/profile', label: 'Hồ sơ' },
    { key: '/change-password', label: 'Đổi mật khẩu' }
  ];
  const supportOptions = [
    { to: '/assistant', icon: <Sparkle weight="fill" />, title: 'Hỏi trợ lý AI', hint: 'Gợi ý sản phẩm và câu hỏi thường gặp' },
    { to: '/support', icon: <ChatCircleText />, title: 'Trò chuyện với nhân viên', hint: 'Mở cuộc hỗ trợ trong tài khoản' },
    { to: '/support', icon: <Question />, title: 'Trung tâm trợ giúp', hint: 'Xem hướng dẫn sử dụng SecondSafe' }
  ];

  return (
    <AppErrorBoundary>
      <AppProviders themeMode={theme} language={language}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Layout className="site-layout">
            <a className="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
            <div className="marketplace-announcement" role="status">
              <Flex className="container marketplace-announcement__content" align="center" justify="flex-end" gap={12}>
                <span className="marketplace-announcement__text">{english ? 'SecondSafe · Safe, transparent second-hand marketplace' : 'SecondSafe · Mua đồ đã qua sử dụng, chọn lọc và trao đổi minh bạch'}</span>
                <Button type="text" size="small" onClick={() => setSupportOpen(true)}>{english ? 'Help center' : 'Trung tâm hỗ trợ'}</Button>
                {canChooseTheme(session.role) && <ThemeToggle theme={theme} onToggle={toggleTheme} language={language} />}
                <LanguageSwitcher value={language} onChange={setLanguage} />
              </Flex>
            </div>
            <Layout.Header className="site-header">
              <div className="container">
                <Flex className="site-header__content" align="center" justify="space-between" gap={20} wrap>
                  <Link className="site-brand" to="/" aria-label="SecondSafe — Trang chủ">
                    <span className="site-brand__mark" aria-hidden="true">S</span>
                    <span>SecondSafe</span>
                  </Link>
                  <nav className="site-header__links" aria-label="Điều hướng chính">
                    <Flex align="center" gap={4} wrap>
                      <NavMenu items={mainLinks} className="site-menu" />
                      {isAuthenticated && !adminRole && !staffRole && <LinkButton type="primary" shape="round" to="/product/create">Đăng tin</LinkButton>}
                      {isAuthenticated && (
                        <Popover
                          open={notificationsOpen}
                          onOpenChange={setNotificationsOpen}
                          trigger="click"
                          placement="bottomRight"
                          destroyOnHidden
                          content={(
                            <Suspense fallback={<p role="status">Đang tải thông báo...</p>}>
                              <NotificationPanel isOpen onClose={() => setNotificationsOpen(false)} onUnreadCountChange={setUnreadCount} />
                            </Suspense>
                          )}
                        >
                          <Badge count={unreadCount} size="small" offset={[-6, 6]}>
                            <Button type="text" shape="round" aria-expanded={notificationsOpen}>Thông báo</Button>
                          </Badge>
                        </Popover>
                      )}
                      {isAuthenticated ? (
                        <Button type="text" shape="round" onClick={handleLogout}>Đăng xuất</Button>
                      ) : (
                        <>
                          <LinkButton type="text" shape="round" to="/login">Đăng nhập</LinkButton>
                          <LinkButton type="primary" shape="round" to="/register">Đăng ký</LinkButton>
                        </>
                      )}
                    </Flex>
                  </nav>
                </Flex>
                {isAuthenticated && (
                  <nav className="site-header__account" aria-label="Tài khoản và công việc">
                    <NavMenu items={accountLinks} className="site-menu site-menu--account" />
                  </nav>
                )}
              </div>
            </Layout.Header>
            {logoutError && <p className="site-header__error" role="alert">{logoutError}</p>}
            <PageContent />
            <SupportFloatButton />
            <Modal open={supportOpen} title="Liên hệ SecondSafe" footer={null} onCancel={() => setSupportOpen(false)} centered width={420}>
              <List
                className="support-contact-list"
                dataSource={supportOptions}
                renderItem={option => (
                  <List.Item className="support-contact-item">
                    <Link to={option.to} onClick={() => setSupportOpen(false)}>
                      <Flex align="center" gap={12}>
                        <span className="support-contact-item__icon" aria-hidden="true">{option.icon}</span>
                        <span className="support-contact-item__text"><strong>{option.title}</strong><small>{option.hint}</small></span>
                      </Flex>
                    </Link>
                  </List.Item>
                )}
              />
            </Modal>
            <Layout.Footer className="site-footer"><div className="container">SecondSafe · Trao đồ cũ, nhận giá trị mới.</div></Layout.Footer>
          </Layout>
        </BrowserRouter>
      </AppProviders>
    </AppErrorBoundary>
  );
}
