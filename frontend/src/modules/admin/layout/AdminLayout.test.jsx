import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AdminLayout from './AdminLayout';

let mockAuth;
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => mockAuth }));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderLayout(path = '/admin/revenue') {
  return render(
    <MemoryRouter future={future} initialEntries={[path]}>
      <Where />
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<h1>Tổng quan giả lập</h1>} />
          <Route path="/admin/revenue" element={<h1>Doanh thu giả lập</h1>} />
          <Route path="/admin/orders/:id" element={<h1>Đơn giả lập</h1>} />
        </Route>
        <Route path="/login" element={<h1>Đăng nhập</h1>} />
        <Route path="/moderator/dashboard" element={<h1>Bảng nhân viên</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockAuth = { user: { role: 'admin', fullName: 'Quản Trị Viên', avatar: '' }, logout: jest.fn() };
});

test('shows the admin shell around the page, with every menu entry and the current one selected', () => {
  renderLayout();

  expect(screen.getByRole('heading', { name: 'Doanh thu giả lập' })).toBeInTheDocument();
  expect(screen.getByText('Bảng điều hành quản trị', { selector: '.admin-header__title strong' })).toBeInTheDocument();
  expect(screen.getByText('Quản lý toàn bộ hệ thống')).toBeInTheDocument();
  expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  expect(screen.getAllByText('Quản Trị Viên').length).toBeGreaterThan(0);

  const links = ['Tổng quan', 'Báo cáo doanh thu', 'Quản lý người dùng', 'Quản lý báo cáo', 'Quản lý đơn hàng', 'Đánh giá & Nhận xét', 'Duyệt rút tiền', 'Giải quyết tranh chấp'];
  for (const name of links) {
    expect(screen.getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument();
  }
  expect(screen.getByRole('link', { name: /^Báo cáo doanh thu/ }).closest('li')).toHaveClass('ant-menu-item-selected');
  expect(screen.getByRole('link', { name: /^Tổng quan/ }).closest('li')).not.toHaveClass('ant-menu-item-selected');
});

test('a nested order page keeps the orders menu entry selected', () => {
  renderLayout('/admin/orders/o1');

  expect(screen.getByRole('link', { name: /^Quản lý đơn hàng/ }).closest('li')).toHaveClass('ant-menu-item-selected');
});

test('following a menu entry opens that page', () => {
  renderLayout('/admin/revenue');

  fireEvent.click(screen.getByRole('link', { name: /^Tổng quan/ }));
  expect(screen.getByTestId('where')).toHaveTextContent('/admin/dashboard');
  expect(screen.getByRole('heading', { name: 'Tổng quan giả lập' })).toBeInTheDocument();
});

test('the menu button opens the sidebar on small screens and the close button closes it', () => {
  const { container } = renderLayout();
  const sidebar = container.querySelector('.admin-sidebar');
  expect(sidebar).not.toHaveClass('admin-sidebar--open');

  fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
  expect(sidebar).toHaveClass('admin-sidebar--open');
  expect(container.querySelector('.admin-overlay')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }));
  expect(sidebar).not.toHaveClass('admin-sidebar--open');
});

test('the account menu signs the administrator out and returns to the login page', async () => {
  renderLayout();

  fireEvent.click(screen.getByRole('button', { name: /Quản Trị Viên/ }));
  const logout = await screen.findByText('Đăng xuất');
  expect(screen.getByText('Administrator')).toBeInTheDocument();
  fireEvent.click(logout);

  await waitFor(() => expect(mockAuth.logout).toHaveBeenCalledTimes(1));
  expect(screen.getByTestId('where')).toHaveTextContent('/login');
});

test('visitors who are not administrators are sent away', () => {
  mockAuth = { user: null, logout: jest.fn() };
  const { unmount } = renderLayout();
  expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  unmount();

  mockAuth = { user: { role: 'moderator' }, logout: jest.fn() };
  renderLayout();
  expect(screen.getByRole('heading', { name: 'Bảng nhân viên' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /^Tổng quan/ })).not.toBeInTheDocument();
});
