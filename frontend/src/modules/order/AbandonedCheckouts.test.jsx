import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AbandonedCheckouts from './AbandonedCheckouts';
import abandonedCheckoutService from '../../services/abandonedCheckout.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/abandonedCheckout.service', () => ({
  __esModule: true,
  default: { getMine: jest.fn(), dismiss: jest.fn() }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const checkouts = [
  { _id: 'c1', source: 'order', action: 'resume_payment', amount: 50000, orderId: 'order-9', paymentDeadline: '2026-11-10T10:03:00Z', product: { _id: 'p9', title: 'Sách chờ thanh toán', images: [] } },
  { _id: 'c2', source: 'cart', action: 'buy_again', amount: 70000, orderId: null, product: { _id: 'p8', title: 'Đèn bỏ quên', images: [] } },
  { _id: 'c3', source: 'order', action: 'buy_again', amount: 90000, orderId: 'order-3', product: { _id: 'p7', title: 'Ghế quá hạn', images: [] } }
];

function renderSection() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future}>
        <Where />
        <Routes>
          <Route path="/" element={<AbandonedCheckouts />} />
          <Route path="*" element={<p>Trang khác</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.localStorage.setItem('token', 'test-token');
  abandonedCheckoutService.getMine.mockResolvedValue(checkouts);
  abandonedCheckoutService.dismiss.mockResolvedValue({});
});

test('lists each unfinished checkout with the one step that completes it', async () => {
  renderSection();

  const section = await screen.findByRole('region', { name: 'Thanh toán dang dở' });
  expect(within(section).getByText(/Đơn hàng sẽ tự hủy lúc/)).toBeInTheDocument();
  expect(within(section).getByText('Sản phẩm vẫn đang chờ trong giỏ hàng của bạn.')).toBeInTheDocument();
  expect(within(section).getByText('Đơn hàng đã hủy vì quá hạn thanh toán. Sản phẩm vẫn còn bán.')).toBeInTheDocument();
  expect(within(section).getByRole('link', { name: 'Tiếp tục thanh toán' })).toHaveAttribute('href', '/orders/order-9/pay');
  expect(within(section).getAllByRole('link', { name: 'Mua lại' })).toHaveLength(2);
  expect(within(section).getByRole('link', { name: 'Sách chờ thanh toán' })).toHaveAttribute('href', '/product/p9');
  expect(within(section).getByText(/50\.000/)).toBeInTheDocument();
});

test('the action links navigate inside the app', async () => {
  renderSection();
  const section = await screen.findByRole('region', { name: 'Thanh toán dang dở' });

  fireEvent.click(within(section).getByRole('link', { name: 'Tiếp tục thanh toán' }));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders/order-9/pay');
});

test('dismissing a checkout removes only that one', async () => {
  renderSection();
  const section = await screen.findByRole('region', { name: 'Thanh toán dang dở' });

  fireEvent.click(within(section).getAllByRole('button', { name: 'Bỏ qua' })[1]);
  await waitFor(() => expect(screen.queryByText('Đèn bỏ quên')).not.toBeInTheDocument());
  expect(abandonedCheckoutService.dismiss).toHaveBeenCalledWith('c2');
  expect(screen.getByText('Sách chờ thanh toán')).toBeInTheDocument();
});

test('a failed dismissal keeps the checkout and says why', async () => {
  abandonedCheckoutService.dismiss.mockRejectedValue(new Error('Không có quyền'));
  renderSection();
  const section = await screen.findByRole('region', { name: 'Thanh toán dang dở' });

  fireEvent.click(within(section).getAllByRole('button', { name: 'Bỏ qua' })[0]);
  expect(await within(section).findByRole('alert')).toHaveTextContent('Không có quyền');
  expect(screen.getByText('Sách chờ thanh toán')).toBeInTheDocument();
});

test('renders nothing without a session, without checkouts or when the list cannot load', async () => {
  window.localStorage.clear();
  const { unmount } = renderSection();
  expect(abandonedCheckoutService.getMine).not.toHaveBeenCalled();
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  unmount();

  window.localStorage.setItem('token', 'test-token');
  abandonedCheckoutService.getMine.mockResolvedValue([]);
  const second = renderSection();
  await waitFor(() => expect(abandonedCheckoutService.getMine).toHaveBeenCalled());
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  second.unmount();

  abandonedCheckoutService.getMine.mockRejectedValue(new Error('offline'));
  renderSection();
  await waitFor(() => expect(abandonedCheckoutService.getMine).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
});
