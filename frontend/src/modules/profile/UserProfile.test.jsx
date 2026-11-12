import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserProfile from './UserProfile';
import { getPublicProfile, getUserStats } from '../../services/user.service';
import productService from '../../services/product.service';
import AppProviders from '../../ui/AppProviders';

let mockCurrentUser = { _id: 'viewer-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockCurrentUser }) }));
jest.mock('../../services/user.service', () => ({ getPublicProfile: jest.fn(), getUserStats: jest.fn() }));
jest.mock('../../services/product.service', () => ({ __esModule: true, default: { getProducts: jest.fn() } }));
jest.mock('../report/ReportUser', () => ({
  __esModule: true,
  default: ({ reportedUser, onSuccess, onCancel }) => (
    <div role="dialog" aria-label="Báo cáo người dùng">
      <span>{reportedUser.fullName}</span>
      <button type="button" onClick={onSuccess}>Gửi báo cáo</button>
      <button type="button" onClick={onCancel}>Đóng báo cáo</button>
    </div>
  )
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const SELLER = { _id: 'seller-1', fullName: 'Trần Thị Bích', createdAt: '2025-06-01T00:00:00Z', rating: 4.2, totalReviews: 5 };

function renderPage() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/user/seller-1']}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/login" element={<h1>Đăng nhập</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = { _id: 'viewer-1' };
  getPublicProfile.mockResolvedValue({ data: SELLER });
  getUserStats.mockResolvedValue({ data: { rating: 4.8, totalReviews: 9 } });
  productService.getProducts.mockResolvedValue({
    products: [
      { _id: 'p1', title: 'Balo cũ', price: 150000, images: [], location: { district: 'Ba Đình', city: 'Hà Nội' } },
      { _id: 'p2', title: 'Sách giáo khoa', price: 50000, images: [], location: { district: 'Cầu Giấy', city: 'Hà Nội' } }
    ]
  });
});

test('shows the seller, the stats and the listings that link to their pages', async () => {
  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: 'Trần Thị Bích' })).toBeInTheDocument();
  expect(productService.getProducts).toHaveBeenCalledWith({ seller: 'seller-1', limit: 12 });
  expect(screen.getByText(/4\.8\/5 · 9 đánh giá/)).toBeInTheDocument();
  expect(screen.getAllByText(/2 sản phẩm đang bán|Sản phẩm đang bán \(2\)/).length).toBeGreaterThan(0);
  const card = screen.getByRole('heading', { name: 'Balo cũ' }).closest('a');
  expect(card).toHaveAttribute('href', '/product/p1');
  expect(card).toHaveTextContent(/150\.000/);
  expect(card).toHaveTextContent('Ba Đình, Hà Nội');
  expect(screen.getByRole('link', { name: 'Xem đánh giá người bán' })).toHaveAttribute('href', '/user/seller-1/reviews');
});

test('a seller without listings says so', async () => {
  productService.getProducts.mockResolvedValue({ products: [] });
  renderPage();
  expect(await screen.findByText('Người dùng chưa có sản phẩm nào')).toBeInTheDocument();
});

test('a failed load shows an alert with a way back', async () => {
  getPublicProfile.mockRejectedValue({ response: { data: { message: 'Không tìm thấy người dùng' } } });
  renderPage();
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Không tìm thấy người dùng');
  expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
});

test('other members can report the seller through the report dialog', async () => {
  renderPage();
  await screen.findByRole('heading', { level: 1, name: 'Trần Thị Bích' });

  fireEvent.click(screen.getByRole('button', { name: 'Báo cáo người dùng' }));
  expect(await screen.findByRole('dialog', { name: 'Báo cáo người dùng' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }));
  expect(await screen.findByText(/Báo cáo người dùng đã được gửi thành công/)).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: 'Báo cáo người dùng' })).not.toBeInTheDocument();
});

test('the owner of the profile does not get a report button', async () => {
  mockCurrentUser = { _id: 'seller-1' };
  renderPage();
  await screen.findByRole('heading', { level: 1, name: 'Trần Thị Bích' });
  expect(screen.queryByRole('button', { name: 'Báo cáo người dùng' })).not.toBeInTheDocument();
});

test('a signed-out visitor who tries to report is sent to sign in', async () => {
  mockCurrentUser = null;
  renderPage();
  await screen.findByRole('heading', { level: 1, name: 'Trần Thị Bích' });

  fireEvent.click(screen.getByRole('button', { name: 'Báo cáo người dùng' }));
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
});
