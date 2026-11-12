import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Profile from './Profile';
import { getProfile } from '../../services/user.service';
import AppProviders from '../../ui/AppProviders';

const mockUser = { _id: 'user-1' };
const mockLogout = jest.fn();
let mockAuth = { user: mockUser, logout: mockLogout, loading: false };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => mockAuth }));
jest.mock('../../services/user.service', () => ({ getProfile: jest.fn() }));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const PROFILE = {
  _id: 'user-1',
  fullName: 'Nguyễn Văn An',
  email: 'an@example.test',
  phone: '0912345678',
  address: 'Hà Nội',
  role: 'user',
  rating: 4.5,
  totalReviews: 12,
  createdAt: '2025-03-15T00:00:00Z'
};

function renderProfile() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<h1>Đăng nhập</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { user: mockUser, logout: mockLogout, loading: false };
  getProfile.mockResolvedValue({ data: PROFILE });
});

test('shows the account details, the rating with a link to the reviews and the member date', async () => {
  renderProfile();

  expect(await screen.findByRole('heading', { level: 1, name: 'Thông tin tài khoản' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
  expect(screen.getByText('an@example.test')).toBeInTheDocument();
  expect(screen.getByText('0912345678')).toBeInTheDocument();
  expect(screen.getByText('Hà Nội')).toBeInTheDocument();
  expect(screen.getByText('user', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(screen.getByText(/4\.5\/5/)).toBeInTheDocument();
  expect(screen.getByText(/12 đánh giá/)).toBeInTheDocument();
  expect(screen.getByText(/2025/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Xem chi tiết đánh giá' })).toHaveAttribute('href', '/user/user-1/reviews');
  expect(screen.getByRole('link', { name: 'Chỉnh sửa' })).toHaveAttribute('href', '/profile/edit');
});

test('missing details read "Chưa cập nhật" and "Chưa có"', async () => {
  getProfile.mockResolvedValue({ data: { ...PROFILE, phone: '', address: '', rating: 0, totalReviews: 0 } });
  renderProfile();

  await screen.findByRole('heading', { name: 'Nguyễn Văn An' });
  expect(screen.getAllByText('Chưa cập nhật')).toHaveLength(2);
  expect(screen.getByText('Chưa có')).toBeInTheDocument();
});

test('quick actions link to the main account pages', async () => {
  renderProfile();
  await screen.findByRole('heading', { name: 'Nguyễn Văn An' });

  expect(screen.getByRole('link', { name: 'Quản lý sản phẩm' })).toHaveAttribute('href', '/my-products');
  expect(screen.getByRole('link', { name: 'Đơn hàng của tôi' })).toHaveAttribute('href', '/orders');
  expect(screen.getByRole('link', { name: 'Ví của tôi' })).toHaveAttribute('href', '/wallet');
  expect(screen.getByRole('link', { name: 'Tin nhắn' })).toHaveAttribute('href', '/chat');
  expect(screen.getByRole('link', { name: 'Đổi mật khẩu' })).toHaveAttribute('href', '/profile/change-password');
});

test('logging out clears the session and goes to the sign-in page', async () => {
  renderProfile();
  await screen.findByRole('heading', { name: 'Nguyễn Văn An' });

  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
});

test('a failed load shows an alert that retries', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  getProfile.mockRejectedValueOnce(new Error('network'));
  renderProfile();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Không thể tải thông tin profile');
  fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
  consoleError.mockRestore();
});

test('a signed-out visitor is asked to sign in', () => {
  mockAuth = { user: null, logout: mockLogout, loading: false };
  getProfile.mockResolvedValue({ data: PROFILE });
  renderProfile();
  expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng đăng nhập để xem profile');
});
