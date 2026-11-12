import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SEPayOrderSuccess from './SEPayOrderSuccess';
import sePayService from '../../services/sepay.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/sepay.service', () => ({
  __esModule: true,
  default: { checkOrderTransactionStatus: jest.fn() }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderPage(search = '?transactionId=abcdef123456') {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={[`/orders/sepay-success${search}`]}>
        <Where />
        <Routes>
          <Route path="/orders/sepay-success" element={<SEPayOrderSuccess />} />
          <Route path="*" element={<p>Danh sách đơn hàng</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

afterEach(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('a completed payment shows the amount and the short transaction code and leads back to the orders', async () => {
  sePayService.checkOrderTransactionStatus.mockResolvedValue({
    success: true, status: 'completed', amount: 520000, orderId: 'order-1', transactionId: 'abcdef1234567890'
  });
  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: 'Thanh toán thành công!' })).toBeInTheDocument();
  expect(screen.getByText('Thanh toán đơn hàng thành công!')).toBeInTheDocument();
  expect(screen.getByText(/520\.000/)).toBeInTheDocument();
  expect(screen.getByText('ABCDEF12')).toBeInTheDocument();
  expect(sePayService.checkOrderTransactionStatus).toHaveBeenCalledWith('abcdef123456');

  fireEvent.click(screen.getByRole('button', { name: 'Về danh sách đơn hàng' }));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders');
});

test('a missing transaction code is reported without asking the server', async () => {
  renderPage('');

  expect(await screen.findByRole('heading', { level: 1, name: 'Thanh toán không thành công' })).toBeInTheDocument();
  expect(screen.getByText('Không tìm thấy mã giao dịch cục bộ')).toBeInTheDocument();
  expect(sePayService.checkOrderTransactionStatus).not.toHaveBeenCalled();
});

test('a rejected payment shows the server message', async () => {
  sePayService.checkOrderTransactionStatus.mockResolvedValue({ success: false, status: 'failed', message: 'Ngân hàng từ chối giao dịch' });
  renderPage();

  expect(await screen.findByText('Ngân hàng từ chối giao dịch')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Thanh toán không thành công' })).toBeInTheDocument();
});

test('a failed status request shows a generic message', async () => {
  sePayService.checkOrderTransactionStatus.mockRejectedValue(new Error('offline'));
  renderPage();

  expect(await screen.findByText('Có lỗi xảy ra khi kiểm tra giao dịch')).toBeInTheDocument();
});

test('a pending payment keeps checking and shows the result once the bank confirms', async () => {
  jest.useFakeTimers();
  sePayService.checkOrderTransactionStatus
    .mockResolvedValueOnce({ success: true, status: 'pending' })
    .mockResolvedValueOnce({ status: 'completed', amount: 520000, orderId: 'order-1', transactionId: 'abcdef1234567890' });
  renderPage();

  await act(async () => {});
  expect(screen.getByRole('status')).toHaveTextContent('Hệ thống đang xử lý giao dịch');
  expect(screen.getByRole('heading', { level: 1, name: 'Đang kiểm tra...' })).toBeInTheDocument();

  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(await screen.findByRole('heading', { level: 1, name: 'Thanh toán thành công!' })).toBeInTheDocument();
  expect(sePayService.checkOrderTransactionStatus).toHaveBeenCalledTimes(2);
});

test('a pending payment that the bank never confirms ends as not received', async () => {
  jest.useFakeTimers();
  sePayService.checkOrderTransactionStatus.mockResolvedValueOnce({ success: true, status: 'pending' });
  sePayService.checkOrderTransactionStatus.mockResolvedValue({ status: 'failed' });
  renderPage();

  await act(async () => {});
  await act(async () => { jest.advanceTimersByTime(5000); });

  await waitFor(() => expect(screen.getByText('Hệ thống chưa nhận được tiền hoặc giao dịch thất bại.')).toBeInTheDocument());
});
