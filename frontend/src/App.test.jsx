import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';
import productService from './services/product.service';
import favoriteService from './services/favorite.service';
import cartService from './services/cart.service';
import chatService from './services/chat.service';
import { createPurchaseRequest } from './services/order.service';
import authService from './services/auth.service';
import dashboardService from './services/dashboard.service';
import { signInWithPopup } from 'firebase/auth';
import { AuthProvider } from './context/AuthContext';
import notificationService from './services/notification.service';

jest.mock('firebase/auth', () => ({ GoogleAuthProvider: jest.fn(), signInWithPopup: jest.fn() }));
jest.mock('./config/firebase', () => ({ auth: {} }));

jest.mock('./services/product.service', () => ({
  __esModule: true,
  default: { getProducts: jest.fn(), getProductById: jest.fn() }
}));
jest.mock('./services/favorite.service', () => ({
  __esModule: true,
  default: {
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    getFavorites: jest.fn(),
    checkFavorite: jest.fn()
  }
}));
jest.mock('./services/cart.service', () => ({
  __esModule: true,
  default: { addToCart: jest.fn(), getCart: jest.fn(), removeFromCart: jest.fn() }
}));
jest.mock('./services/chat.service', () => ({
  __esModule: true,
  default: {
    openConversation: jest.fn(),
    getConversations: jest.fn(),
    getMessages: jest.fn(),
    markAsRead: jest.fn(),
    sendMessage: jest.fn()
  },
  connectChatSocket: jest.fn(() => ({
    connected: false,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn()
  })),
  chatImageUrl: value => value
}));
jest.mock('./services/order.service', () => ({
  createPurchaseRequest: jest.fn()
}));
jest.mock('./services/auth.service', () => {
  const service = {
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    verifyLogin2FA: jest.fn(),
    getProfile: jest.fn(),
    requestRegistrationCode: jest.fn(),
    verifyRegistration: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    logout: jest.fn()
  };
  return { __esModule: true, default: service, authService: service };
});
jest.mock('./services/notification.service', () => ({
  __esModule: true, default: { getNotifications: jest.fn(), getUnreadCount: jest.fn() }
}));
jest.mock('./services/dashboard.service', () => ({
  __esModule: true,
  default: { getAdminDashboard: jest.fn(), getStaffDashboard: jest.fn() }
}));

beforeEach(() => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('secondsafe:role');
  window.localStorage.removeItem('user');
  jest.clearAllMocks();
});

test('renders the Vietnamese catalog and accessible navigation', async () => {
  productService.getProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0, limit: 20 });
  window.history.replaceState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Giá tốt, gần bạn, chốt nhanh!' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Chuyển đến nội dung chính' })).toHaveAttribute('href', '#main-content');
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  expect(await screen.findByText('Không tìm thấy sản phẩm nào')).toBeInTheDocument();
});

test('loads and scrolls to the next product batch without removing the current listings', async () => {
  const makeProducts = (prefix, count) => Array.from({ length: count }, (_, index) => ({
    _id: `${prefix}-${index}`,
    title: `${prefix} product ${index}`,
    price: 10000,
    images: ['/images/placeholders/product-placeholder.svg'],
    category: { slug: 'books' },
    location: { city: 'Hà Nội' },
    createdAt: new Date().toISOString()
  }));
  const scrollIntoView = jest.fn();
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = scrollIntoView;
  let resolveNextPage;
  productService.getProducts
    .mockResolvedValueOnce({ products: makeProducts('first', 20), total: 40, totalPages: 2, limit: 20 })
    .mockImplementationOnce(() => new Promise(resolve => { resolveNextPage = resolve; }));
  window.history.replaceState({}, '', '/');
  try {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'first product 0' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }));

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(20);
    expect(screen.getByRole('heading', { name: 'first product 0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đang tải sản phẩm...' })).toBeDisabled();
    resolveNextPage({ products: makeProducts('next', 20), total: 40, totalPages: 2, limit: 20 });

    expect(await screen.findByRole('heading', { name: 'next product 0' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(40);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }));
  } finally {
    if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
    else delete Element.prototype.scrollIntoView;
  }
});

test('unknown routes show an actionable Vietnamese error', () => {
  window.history.replaceState({}, '', '/missing-page');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
});

test('assistant and support pages are reachable from navigation and prompt guests to sign in', async () => {
  window.history.replaceState({}, '', '/assistant');
  const assistantView = render(<App />);
  expect(await screen.findByRole('heading', { name: 'Trợ lý SecondSafe' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Hỗ trợ' })).toHaveAttribute('href', '/support');
  assistantView.unmount();

  window.history.replaceState({}, '', '/support');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Hỗ trợ khách hàng' })).toBeInTheDocument();
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
});

test('login stores the token, notifies the header and returns to the home page', async () => {
  productService.getProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0, limit: 20 });
  authService.login.mockResolvedValue({ token: 'signed-token', user: { fullName: 'Test', role: 'user' } });
  window.history.replaceState({}, '', '/login');
  render(<App />);

  await screen.findByRole('heading', { name: 'Đăng nhập' });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'person@example.test' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'StrongPass1!' } });
  const passwordInput = screen.getByLabelText('Mật khẩu');
  fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
  expect(passwordInput).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
  expect(passwordInput).toHaveAttribute('type', 'password');
  expect(passwordInput).toHaveValue('StrongPass1!');
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

  await waitFor(() => expect(window.localStorage.getItem('token')).toBe('signed-token'));
  expect(await screen.findByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
  expect(authService.login).toHaveBeenCalledWith({ email: 'person@example.test', password: 'StrongPass1!' });

  authService.logout.mockResolvedValue(null);
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
  await waitFor(() => expect(window.localStorage.getItem('token')).toBeNull());
  expect(await screen.findByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument();
});

test('registration verifies the emailed code and signs in the new account', async () => {
  productService.getProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0, limit: 20 });
  authService.requestRegistrationCode.mockResolvedValue({});
  authService.verifyRegistration.mockResolvedValue({ token: 'registered-token', user: { role: 'user' } });
  window.history.replaceState({}, '', '/register');
  render(<App />);

  await screen.findByRole('heading', { name: 'Đăng ký' });
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Test Person' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'person@example.test' } });
  fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0912345678' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'StrongPass1!' } });
  const passwordInput = screen.getByLabelText('Mật khẩu');
  fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
  expect(passwordInput).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
  expect(passwordInput).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi mã xác thực' }));
  expect(await screen.findByText(/Mã xác thực đã được gửi/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Mã xác thực 6 chữ số'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đăng ký' }));
  await waitFor(() => expect(window.localStorage.getItem('token')).toBe('registered-token'));
  expect(authService.verifyRegistration).toHaveBeenCalledWith({ email: 'person@example.test', code: '123456' });
});

test('two-factor login stores no session until the emailed code is verified', async () => {
  productService.getProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0, limit: 20 });
  authService.login.mockResolvedValue({ requires2FA: true, email: 'person@example.test' });
  authService.verifyLogin2FA.mockResolvedValue({ token: 'verified-token', user: { role: 'user' } });
  window.history.replaceState({}, '', '/login');
  render(<App />);
  await screen.findByRole('heading', { name: 'Đăng nhập' });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'person@example.test' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'StrongPass1!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  const code = await screen.findByLabelText('Mã xác thực 6 chữ số');
  expect(window.localStorage.getItem('token')).toBeNull();
  fireEvent.change(code, { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác thực đăng nhập' }));
  await waitFor(() => expect(window.localStorage.getItem('token')).toBe('verified-token'));
  expect(authService.verifyLogin2FA).toHaveBeenCalledWith('person@example.test', '123456');
});

test('Google login exchanges the Firebase token and shares the resulting session', async () => {
  productService.getProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0, limit: 20 });
  signInWithPopup.mockResolvedValue({ user: { getIdToken: jest.fn().mockResolvedValue('firebase-token') } });
  authService.loginWithGoogle.mockResolvedValue({ token: 'google-token', user: { role: 'user' } });
  window.history.replaceState({}, '', '/login');
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Đăng nhập với Google' }));
  await waitFor(() => expect(window.localStorage.getItem('token')).toBe('google-token'));
  expect(authService.loginWithGoogle).toHaveBeenCalledWith('firebase-token');
  expect(window.localStorage.getItem('secondsafe:role')).toBe('user');
});

test('an authenticated profile can open notifications and logout clears the shared session', async () => {
  productService.getProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0, limit: 20 });
  authService.getProfile.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', role: 'user', fullName: 'Test User' });
  authService.logout.mockResolvedValue(null);
  notificationService.getNotifications.mockResolvedValue({ notifications: [], pagination: { page: 1, totalPages: 1 } });
  notificationService.getUnreadCount.mockResolvedValue(0);
  window.localStorage.setItem('token', 'profile-token');
  window.history.replaceState({}, '', '/');
  render(<AuthProvider><App /></AuthProvider>);
  await waitFor(() => expect(window.localStorage.getItem('secondsafe:role')).toBe('user'));
  fireEvent.click(screen.getByRole('button', { name: 'Thông báo' }));
  expect(await screen.findByText('Không có thông báo nào')).toBeInTheDocument();
  expect(notificationService.getNotifications).toHaveBeenCalledWith(1, 20);
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
  await waitFor(() => expect(window.localStorage.getItem('user')).toBeNull());
  expect(window.localStorage.getItem('token')).toBeNull();
  expect(window.localStorage.getItem('secondsafe:role')).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Thông báo' })).not.toBeInTheDocument();
});

test('admin role sees the admin dashboard and loads live platform metrics', async () => {
  window.localStorage.setItem('token', 'admin-token');
  window.localStorage.setItem('secondsafe:role', 'admin');
  dashboardService.getAdminDashboard.mockResolvedValue({
    generatedAt: '2026-10-27T00:00:00.000Z',
    users: { total: 5, byRole: { user: 4 }, byStatus: { active: 5 } },
    products: { total: 10, byStatus: { active: 6 }, byCategory: [{ category: 'Sách', count: 4 }] },
    orders: { total: 4, byStatus: { completed: 2, paid: 1 }, valueVnd: 400000, monthly: [{ month: '2026-10', count: 2 }] },
    purchaseRequests: { byStatus: { pending: 2 } },
    reports: { byStatus: { reviewing: 1 } },
    disputes: { byStatus: { investigating: 1 } },
    transactions: { feeRevenueVnd: 15000 },
    pendingWithdrawals: 0,
    wallets: { total: 5 },
    reviews: { total: 2, averageRating: 4.5 },
    deliveries: { byStatus: {} }
  });
  window.history.replaceState({}, '', '/admin');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Bức tranh toàn cảnh' })).toBeInTheDocument();
  expect(await screen.findByText('15.000 ₫')).toBeInTheDocument();
  expect(screen.getByText('Sách')).toBeInTheDocument();
  expect(screen.getByText('Quản trị', { selector: 'strong' })).toBeInTheDocument();
  expect(screen.queryByText('Hệ thống demo')).not.toBeInTheDocument();
  expect(document.querySelector('.dashboard-sidebar__brand-mark')).toBeInTheDocument();
  expect(dashboardService.getAdminDashboard).toHaveBeenCalledTimes(1);
});

test('admin login stores the role and opens the administrator dashboard', async () => {
  authService.login.mockResolvedValue({
    token: 'admin-session-token',
    user: { role: 'admin', fullName: 'Demo Admin' }
  });
  dashboardService.getAdminDashboard.mockResolvedValue({
    generatedAt: '2026-10-27T00:00:00.000Z',
    users: { total: 0, byRole: {}, byStatus: {} },
    products: { total: 0, byStatus: {}, byCategory: [] },
    orders: { total: 0, byStatus: {}, valueVnd: 0, monthly: [] },
    purchaseRequests: { byStatus: {} },
    reports: { byStatus: {} },
    disputes: { byStatus: {} },
    transactions: { feeRevenueVnd: 0 },
    wallets: { total: 0 },
    reviews: { total: 0, averageRating: 0 },
    deliveries: { byStatus: {} }
  });
  window.history.replaceState({}, '', '/login');
  render(<App />);

  await screen.findByRole('heading', { name: 'Đăng nhập' });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.test' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'StrongAdmin1!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

  expect(await screen.findByRole('heading', { name: 'Bức tranh toàn cảnh' })).toBeInTheDocument();
  expect(window.localStorage.getItem('secondsafe:role')).toBe('admin');
  expect(dashboardService.getAdminDashboard).toHaveBeenCalledTimes(1);
});

test('moderator role sees the staff dashboard but not admin-only metrics', async () => {
  window.localStorage.setItem('token', 'staff-token');
  window.localStorage.setItem('secondsafe:role', 'moderator');
  dashboardService.getStaffDashboard.mockResolvedValue({
    generatedAt: '2026-10-27T00:00:00.000Z',
    openDisputes: 1,
    pendingPurchaseRequests: 2,
    openOrders: 2,
    ratings: 2,
    activeDeliveries: 1,
    recentQueue: [{ label: 'Tranh chấp cần xem xét', count: 1 }]
  });
  window.history.replaceState({}, '', '/staff');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Bảng điều phối' })).toBeInTheDocument();
  expect(await screen.findByText('Yêu cầu mua chờ')).toBeInTheDocument();
  expect(dashboardService.getStaffDashboard).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Phí nền tảng/)).not.toBeInTheDocument();
});

test('regular users cannot enter the protected admin dashboard', async () => {
  window.localStorage.setItem('token', 'user-token');
  window.localStorage.setItem('secondsafe:role', 'user');
  window.history.replaceState({}, '', '/admin');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument();
  expect(dashboardService.getAdminDashboard).not.toHaveBeenCalled();
});

test('regular users cannot enter the protected staff dashboard', async () => {
  window.localStorage.setItem('token', 'user-token');
  window.localStorage.setItem('secondsafe:role', 'user');
  window.history.replaceState({}, '', '/staff');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument();
  expect(dashboardService.getStaffDashboard).not.toHaveBeenCalled();
});

test('forgot password requests recovery and submits the emailed credential', async () => {
  authService.forgotPassword.mockResolvedValue({ message: 'Hướng dẫn đã gửi.' });
  authService.resetPassword.mockResolvedValue({ message: 'Đặt lại mật khẩu thành công' });
  window.history.replaceState({}, '', '/forgot-password');
  render(<App />);

  await screen.findByRole('heading', { name: 'Khôi phục mật khẩu' });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'person@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi hướng dẫn khôi phục' }));
  expect(await screen.findByText('Hướng dẫn đã gửi.')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Mã khôi phục'), { target: { value: 'a'.repeat(64) } });
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'NewStrong2!' } });
  const passwordInput = screen.getByLabelText('Mật khẩu mới');
  fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
  expect(passwordInput).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
  expect(passwordInput).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
  expect(await screen.findByRole('link', { name: 'Đến trang đăng nhập' })).toHaveAttribute('href', '/login');
  expect(authService.resetPassword).toHaveBeenCalledWith({
    email: 'person@example.test',
    token: 'a'.repeat(64),
    newPassword: 'NewStrong2!'
  });
});

test('change password requires a session and reports the service result', async () => {
  window.history.replaceState({}, '', '/change-password');
  const unauthenticated = render(<App />);
  expect(await screen.findByText('Vui lòng đăng nhập để đổi mật khẩu.')).toBeInTheDocument();
  unauthenticated.unmount();

  window.localStorage.setItem('token', 'signed-token');
  authService.changePassword.mockResolvedValue({ message: 'Đổi mật khẩu thành công' });
  render(<App />);
  await screen.findByRole('heading', { name: 'Đổi mật khẩu' });
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'OldStrong1!' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'NewStrong2!' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Hiện mật khẩu' })[0]);
  expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveAttribute('type', 'text');
  expect(screen.getByLabelText('Mật khẩu mới')).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
  expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

  expect(await screen.findByText('Đổi mật khẩu thành công')).toBeInTheDocument();
  expect(authService.changePassword).toHaveBeenCalledWith({
    currentPassword: 'OldStrong1!',
    newPassword: 'NewStrong2!'
  });

  authService.logout.mockResolvedValue(null);
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
  expect(await screen.findByText('Vui lòng đăng nhập để đổi mật khẩu.')).toBeInTheDocument();
});

test('product cards open a product detail page', async () => {
  window.localStorage.removeItem('token');
  productService.getProductById.mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    title: 'Sách đã qua sử dụng',
    description: 'Sách còn tốt.',
    price: 50000,
    condition: 'good',
    images: ['/images/placeholders/product-placeholder.svg'],
    category: { name: 'Sách' },
    seller: { fullName: 'Người bán thử' }
  });
  window.history.replaceState({}, '', '/product/507f1f77bcf86cd799439011');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' }, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getByText('Sách còn tốt.')).toBeInTheDocument();
  expect(screen.getByText('Người bán thử')).toBeInTheDocument();
  expect(productService.getProductById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
});

test('missing products show a recovery link', async () => {
  window.localStorage.removeItem('token');
  productService.getProductById.mockRejectedValue(Object.assign(new Error('Không tìm thấy sản phẩm'), { status: 404 }));
  window.history.replaceState({}, '', '/product/507f1f77bcf86cd799439011');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Không tìm thấy sản phẩm' }, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Quay lại danh sách sản phẩm' })).toHaveAttribute('href', '/');
});

test('authenticated buyers can add a product to the persistent cart and favorites', async () => {
  window.localStorage.setItem('token', 'test-token');
  favoriteService.checkFavorite.mockResolvedValue({ data: { isFavorite: false } });
  favoriteService.addFavorite.mockResolvedValue({ success: true });
  cartService.addToCart.mockResolvedValue({ _id: 'cart-item-1' });
  productService.getProductById.mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    title: 'Sách đã qua sử dụng',
    description: 'Sách còn tốt.',
    price: 50000,
    condition: 'good',
    images: ['/images/placeholders/product-placeholder.svg'],
    seller: { fullName: 'Người bán thử' }
  });
  window.history.replaceState({}, '', '/product/507f1f77bcf86cd799439011');
  render(<App />);

  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' }, { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }));
  expect(await screen.findByText(/Đã thêm sản phẩm vào giỏ hàng/)).toBeInTheDocument();
  expect(cartService.addToCart).toHaveBeenCalledWith('507f1f77bcf86cd799439011');

  fireEvent.click(screen.getByRole('button', { name: '♡ Thêm yêu thích' }));
  expect(await screen.findByRole('button', { name: '♥ Đã yêu thích' })).toBeInTheDocument();
  expect(favoriteService.addFavorite).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
});

test('buyers can open a conversation with the product seller', async () => {
  window.localStorage.setItem('token', 'test-token');
  favoriteService.checkFavorite.mockResolvedValue({ data: { isFavorite: false } });
  chatService.openConversation.mockResolvedValue({ _id: 'conversation-id' });
  chatService.getConversations.mockResolvedValue({ conversations: [] });
  chatService.getMessages.mockResolvedValue({ messages: [] });
  productService.getProductById.mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    title: 'Sách đã qua sử dụng',
    description: 'Sách còn tốt.',
    price: 50000,
    images: [],
    seller: { _id: 'seller-id', fullName: 'Người bán thử' }
  });
  window.history.replaceState({}, '', '/product/507f1f77bcf86cd799439011');
  render(<App />);

  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' }, { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Nhắn tin người bán' }));

  await waitFor(() => expect(chatService.openConversation).toHaveBeenCalledWith(
    'seller-id',
    '507f1f77bcf86cd799439011'
  ));
  await waitFor(() => expect(window.location.pathname).toBe('/chat/conversation-id'));
});

test('buyers can confirm a quick purchase and receive the created order reference', async () => {
  window.localStorage.setItem('token', 'test-token');
  favoriteService.checkFavorite.mockResolvedValue({ data: { isFavorite: false } });
  createPurchaseRequest.mockResolvedValue({ success: true, data: { _id: 'order-1' } });
  productService.getProductById.mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    title: 'Sách đã qua sử dụng',
    description: 'Sách còn tốt.',
    price: 50000,
    images: []
  });
  window.history.replaceState({}, '', '/product/507f1f77bcf86cd799439011');
  render(<App />);

  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' }, { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Mua ngay' }));
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận mua ngay' }));

  expect(await screen.findByText('Đã tạo đơn hàng order-1.')).toBeInTheDocument();
  expect(createPurchaseRequest).toHaveBeenCalledWith({
    listingId: '507f1f77bcf86cd799439011',
    message: 'Mua ngay',
    agreedPrice: 50000
  });
});

test('cart page displays saved items and removes them from the account cart', async () => {
  window.localStorage.setItem('token', 'test-token');
  cartService.getCart.mockResolvedValue({
    items: [{
      _id: 'cart-item-1',
      product: {
        _id: '507f1f77bcf86cd799439011',
        title: 'Sách đã lưu trong giỏ',
        price: 50000,
        images: [],
        seller: { fullName: 'Người bán thử' }
      }
    }]
  });
  cartService.removeFromCart.mockResolvedValue({ inCart: false });
  window.history.replaceState({}, '', '/cart');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Sách đã lưu trong giỏ' }, { timeout: 5000 })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
  expect(await screen.findByText('Đã xóa sản phẩm khỏi giỏ hàng.')).toBeInTheDocument();
  expect(cartService.removeFromCart).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
});

test('favorites page renders the authenticated account list', async () => {
  window.localStorage.setItem('token', 'test-token');
  favoriteService.getFavorites.mockResolvedValue({
    data: { favorites: [], total: 0, totalPages: 0 }
  });
  window.history.replaceState({}, '', '/favorites');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Tin đã lưu' }, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Chưa có tin đã lưu' })).toBeInTheDocument();
  expect(favoriteService.getFavorites).toHaveBeenCalled();
});

test('a failed screen shows recovery copy without internal details', () => {
  function BrokenScreen() { throw new Error('private internal error'); }
  const errorOutput = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<AppErrorBoundary><BrokenScreen /></AppErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể hiển thị trang lúc này');
    expect(screen.getByRole('link', { name: 'Tải lại trang chủ' })).toHaveAttribute('href', '/');
    expect(screen.queryByText('private internal error')).not.toBeInTheDocument();
  } finally {
    errorOutput.mockRestore();
  }
});
