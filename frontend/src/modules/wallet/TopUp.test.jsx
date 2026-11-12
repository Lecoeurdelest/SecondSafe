import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TopUp from './TopUp';
import sePayService from '../../services/sepay.service';
import AppProviders from '../../ui/AppProviders';

let mockUser = { _id: 'user-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/sepay.service', () => ({ __esModule: true, default: { createPayment: jest.fn() } }));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function renderTopUp() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/wallet/topup']}>
        <Routes>
          <Route path="/wallet/topup" element={<TopUp />} />
          <Route path="/wallet" element={<h1>Ví của tôi</h1>} />
          <Route path="/login" element={<h1>Đăng nhập</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { _id: 'user-1' };
  HTMLFormElement.prototype.submit = jest.fn();
});

test('signed-out visitors are sent to the sign-in page', async () => {
  mockUser = null;
  renderTopUp();
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
});

test('the submit button stays disabled below the minimum and a quick amount fills the field and the summary', async () => {
  renderTopUp();
  expect(screen.getByRole('heading', { level: 1, name: 'Nạp tiền vào ví' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeDisabled();

  fireEvent.change(screen.getByLabelText('Số tiền (VNĐ)'), { target: { value: '5a000' } });
  expect(screen.getByLabelText('Số tiền (VNĐ)')).toHaveValue('5000');
  expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeDisabled();
  expect(screen.queryByText('Thông tin thanh toán')).not.toBeInTheDocument();

  const quick = screen.getByRole('button', { name: '200.000 VNĐ' });
  fireEvent.click(quick);
  expect(quick).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('Số tiền (VNĐ)')).toHaveValue('200000');
  expect(screen.getByText('Thông tin thanh toán')).toBeInTheDocument();
  expect(screen.getByText('Miễn phí')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeEnabled();
});

test('an amount above the maximum is refused inline and nothing is sent', async () => {
  renderTopUp();
  fireEvent.change(screen.getByLabelText('Số tiền (VNĐ)'), { target: { value: '600000000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Thanh toán' }));

  expect(await screen.findByText('Số tiền nạp tối đa là 500,000,000 VNĐ')).toBeInTheDocument();
  expect(sePayService.createPayment).not.toHaveBeenCalled();
});

test('paying asks the service for a checkout and posts a hidden form to it', async () => {
  sePayService.createPayment.mockResolvedValue({ checkoutUrl: 'https://pay.example.test/checkout', fields: { order: 'o-1', signature: 'abc' } });
  renderTopUp();

  fireEvent.click(screen.getByRole('button', { name: '100.000 VNĐ' }));
  fireEvent.change(screen.getByLabelText('Ghi chú (tùy chọn)'), { target: { value: ' Mua sách ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Thanh toán' }));

  await waitFor(() => expect(sePayService.createPayment).toHaveBeenCalledWith({ amount: 100000, orderInfo: 'Mua sách' }));
  await waitFor(() => expect(HTMLFormElement.prototype.submit).toHaveBeenCalled());
  const form = document.querySelector('form[action="https://pay.example.test/checkout"]');
  expect(form).not.toBeNull();
  expect(form.querySelector('input[name="order"]').value).toBe('o-1');
  expect(form.querySelector('input[name="signature"]').value).toBe('abc');
});

test('a failed checkout shows the message and lets the buyer try again', async () => {
  sePayService.createPayment.mockRejectedValue(new Error('Cổng thanh toán đang bảo trì.'));
  renderTopUp();

  fireEvent.click(screen.getByRole('button', { name: '50.000 VNĐ' }));
  fireEvent.click(screen.getByRole('button', { name: 'Thanh toán' }));

  expect(await screen.findByText('Cổng thanh toán đang bảo trì.')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeEnabled());
});
