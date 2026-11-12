import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OrderPayment from './OrderPayment';
import { getOrderById } from '../../services/order.service';
import walletService from '../../services/wallet.service';
import sePayService, { postToSepay } from '../../services/sepay.service';
import AppProviders from '../../ui/AppProviders';

let mockUser = { _id: 'buyer-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/order.service', () => ({
  getOrderById: jest.fn(),
  payOrder: jest.fn()
}));
jest.mock('../../services/wallet.service', () => ({
  __esModule: true,
  default: { getBalance: jest.fn() }
}));
jest.mock('../../services/sepay.service', () => ({
  __esModule: true,
  default: { createOrderPayment: jest.fn() },
  postToSepay: jest.fn()
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}</p>;
}

function makeOrder(overrides = {}) {
  return {
    _id: 'abcdef1234567890',
    orderCode: 'SS2001',
    status: 'awaiting_payment',
    agreedPrice: 500000,
    totalAmount: 520000,
    createdAt: '2026-11-01T08:00:00.000Z',
    buyer: { _id: 'buyer-1' },
    seller: { fullName: 'Trần Thị Bích', email: 'bich@example.com' },
    listing: { title: 'Máy ảnh film cũ', condition: 'Tốt', images: [], location: { district: 'Quận 1', city: 'Hồ Chí Minh' } },
    ...overrides
  };
}

function renderPage() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/orders/abcdef1234567890/pay']}>
        <Where />
        <Routes>
          <Route path="/orders/:id/pay" element={<OrderPayment />} />
          <Route path="*" element={<p>Trang khác</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { _id: 'buyer-1' };
  getOrderById.mockResolvedValue({ data: makeOrder() });
  walletService.getBalance.mockResolvedValue({ balance: 0 });
  sePayService.createOrderPayment.mockResolvedValue({ checkoutUrl: 'https://pay.example/checkout', fields: { signature: 'sig' } });
});

test('shows the order, the seller, the amounts, the bank transfer method and the escrow notes', async () => {
  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: 'Thanh toán đơn hàng' })).toBeInTheDocument();
  expect(screen.getByText('#SS2001')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Máy ảnh film cũ' })).toBeInTheDocument();
  expect(screen.getByText('Tình trạng: Tốt')).toBeInTheDocument();
  expect(screen.getByText('Khu vực: Quận 1, Hồ Chí Minh')).toBeInTheDocument();
  expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
  expect(screen.getByText('bich@example.com')).toBeInTheDocument();
  expect(screen.getByText(/500\.000/)).toBeInTheDocument();
  expect(screen.getByText(/520\.000/, { selector: 'strong' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Chuyển khoản Ngân hàng' })).toBeInTheDocument();
  expect(screen.getByText(/Thanh toán An toàn:/)).toBeInTheDocument();
  expect(screen.getByText('Tiền sẽ được giữ trong ký quỹ và chỉ chuyển cho người bán khi bạn xác nhận đã nhận hàng')).toBeInTheDocument();
  expect(getOrderById).toHaveBeenCalledWith('abcdef1234567890');
});

test('paying creates the bank transfer and posts the buyer to the checkout page', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /Quét mã QR thanh toán/ }));

  await waitFor(() => expect(sePayService.createOrderPayment).toHaveBeenCalledWith('abcdef1234567890', {
    amount: 520000,
    orderInfo: 'Thanh toan don hang SS2001'
  }));
  await waitFor(() => expect(postToSepay).toHaveBeenCalledWith('https://pay.example/checkout', { signature: 'sig' }));
});

test('a checkout response without the form data shows an error and lets the buyer try again', async () => {
  sePayService.createOrderPayment.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /Quét mã QR thanh toán/ }));

  expect(await screen.findByText('Khong nhan duoc thong tin thanh toan tu SePay')).toBeInTheDocument();
  expect(postToSepay).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole('button', { name: /Quét mã QR thanh toán/ })).toBeEnabled());
});

test('a rejected checkout request shows the reason', async () => {
  sePayService.createOrderPayment.mockRejectedValue(new Error('Đơn hàng đã hết hạn'));
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /Quét mã QR thanh toán/ }));

  expect(await screen.findByText('Đơn hàng đã hết hạn')).toBeInTheDocument();
});

test('cancel returns to the order list', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Hủy' }));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders');
});

test('someone else cannot pay for the order', async () => {
  mockUser = { _id: 'stranger' };
  renderPage();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Bạn không có quyền truy cập trang này');
  fireEvent.click(within(alert).getByRole('button', { name: 'Quay lại trang chủ' }));
  expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/);
  expect(sePayService.createOrderPayment).not.toHaveBeenCalled();
});

test('an order that is already paid links to its details instead of the payment form', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'paid' }) });
  renderPage();

  const notice = (await screen.findByText('Đơn hàng này đã được thanh toán hoặc không thể thanh toán.')).closest('.ant-alert');
  expect(screen.queryByRole('button', { name: /Quét mã QR thanh toán/ })).not.toBeInTheDocument();
  fireEvent.click(within(notice).getByRole('button', { name: 'Xem chi tiết đơn hàng' }));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders/abcdef1234567890');
});

test('a failed load shows the reason and a way back to the orders', async () => {
  getOrderById.mockRejectedValue(new Error('Không tìm thấy đơn hàng'));
  renderPage();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Không tìm thấy đơn hàng');
  fireEvent.click(within(alert).getByRole('button', { name: 'Quay lại danh sách đơn hàng' }));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders');
});

test('shows a status while the order loads', async () => {
  let resolve;
  getOrderById.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  renderPage();

  expect(screen.getByRole('status')).toHaveTextContent('Đang tải...');
  resolve({ data: makeOrder() });
  expect(await screen.findByRole('heading', { level: 1, name: 'Thanh toán đơn hàng' })).toBeInTheDocument();
});
