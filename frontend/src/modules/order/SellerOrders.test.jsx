import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SellerOrders from './SellerOrders';
import { getOrdersAsSeller } from '../../services/order.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/order.service', () => ({
  getOrdersAsSeller: jest.fn()
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

const order = (id, status, title, overrides = {}) => ({
  _id: id,
  status,
  agreedPrice: 120000,
  createdAt: '2026-11-01T08:00:00.000Z',
  productId: { title, images: [] },
  buyerId: { fullName: 'Người mua' },
  ...overrides
});

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

beforeEach(() => {
  jest.clearAllMocks();
  getOrdersAsSeller.mockResolvedValue({
    orders: [
      order('o1', 'paid', 'Balo chờ giao'),
      order('o4', 'awaiting_payment', 'Kính chờ mua', { buyerId: { username: 'khach42' } }),
      order('o2', 'shipped', 'Giày đang giao'),
      order('o3', 'completed', 'Sách đã xong'),
      order('o5', 'disputed', 'Loa tranh chấp')
    ]
  });
});

function renderPage() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future}>
        <Where />
        <Routes>
          <Route path="/" element={<SellerOrders />} />
          <Route path="*" element={<p>Trang khác</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

test('opens on the awaiting-shipment tab and lists only those orders with their counts', async () => {
  renderPage();
  expect(await screen.findByText('Balo chờ giao')).toBeInTheDocument();
  expect(screen.getByText('Kính chờ mua')).toBeInTheDocument();
  expect(screen.queryByText('Giày đang giao')).not.toBeInTheDocument();
  expect(screen.queryByText('Sách đã xong')).not.toBeInTheDocument();

  expect(screen.getByRole('tab', { name: /Chờ giao/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Chờ giao 2' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Đang giao 1' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Hoàn thành 2' })).toBeInTheDocument();
});

test('switching tabs shows the matching orders and keeps exactly one tab selected', async () => {
  renderPage();
  await screen.findByText('Balo chờ giao');

  fireEvent.click(screen.getByRole('tab', { name: /Đang giao/ }));
  expect(await screen.findByText('Giày đang giao')).toBeInTheDocument();
  expect(screen.queryByText('Balo chờ giao')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: /Hoàn thành/ }));
  expect(await screen.findByText('Sách đã xong')).toBeInTheDocument();
  expect(screen.getByText('Loa tranh chấp')).toBeInTheDocument();
  expect(screen.getAllByRole('tab', { selected: true })).toHaveLength(1);
});

test('each order shows the buyer, the date, the price and a status tag', async () => {
  renderPage();
  await screen.findByText('Balo chờ giao');

  const paid = screen.getByText('Balo chờ giao').closest('.seller-order-item');
  expect(within(paid).getByText(/120\.000/)).toBeInTheDocument();
  expect(within(paid).getByText('Người mua')).toBeInTheDocument();
  expect(within(paid).getByText('Đã thanh toán (Chờ giao)')).toBeInTheDocument();

  const waiting = screen.getByText('Kính chờ mua').closest('.seller-order-item');
  expect(within(waiting).getByText('khach42')).toBeInTheDocument();
  expect(within(waiting).getByText('Chưa thanh toán (Chờ mua)')).toBeInTheDocument();
});

test('the details button opens the order', async () => {
  renderPage();
  await screen.findByText('Balo chờ giao');

  const paid = screen.getByText('Balo chờ giao').closest('.seller-order-item');
  fireEvent.click(within(paid).getByRole('button', { name: /Chi tiết/ }));
  expect(screen.getByTestId('where')).toHaveTextContent('/order-detail/o1');
});

test('a tab without orders says so', async () => {
  getOrdersAsSeller.mockResolvedValue({ orders: [order('o3', 'completed', 'Sách đã xong')] });
  renderPage();

  expect(await screen.findByText('Không có đơn hàng')).toBeInTheDocument();
  expect(screen.getByText('Bạn không có đơn hàng nào chờ giao')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: /Đang giao/ }));
  expect(screen.getByText('Bạn không có đơn hàng nào đang giao')).toBeInTheDocument();
});

test('a failed request shows an alert that retries', async () => {
  getOrdersAsSeller
    .mockRejectedValueOnce(new Error('Mất kết nối'))
    .mockResolvedValueOnce({ data: { orders: [order('o1', 'paid', 'Balo chờ giao')] } });
  renderPage();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Mất kết nối');
  fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Balo chờ giao')).toBeInTheDocument();
});

test('shows a status while the orders load', async () => {
  let resolve;
  getOrdersAsSeller.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  renderPage();

  expect(screen.getByRole('status')).toHaveTextContent('Đang tải danh sách đơn hàng...');
  resolve({ orders: [] });
  expect(await screen.findByText('Không có đơn hàng')).toBeInTheDocument();
});
