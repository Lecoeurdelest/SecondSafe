import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopUpResult from './TopUpResult';
import VNPaySuccess from './VNPaySuccess';
import AppProviders from '../../ui/AppProviders';

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function renderAt(element, url) {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={[url]}>{element}</MemoryRouter>
    </AppProviders>
  );
}

test('a successful top-up result offers only the way back to the wallet', () => {
  renderAt(<TopUpResult />, '/wallet/topup/result?success=true&orderInfo=Nap%20100k');

  expect(screen.getByRole('heading', { name: 'Thanh toán thành công' })).toBeInTheDocument();
  expect(screen.getByText('Nạp tiền thành công vào ví của bạn.')).toBeInTheDocument();
  expect(screen.getByText('Nap 100k')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về ví của tôi' })).toHaveAttribute('href', '/wallet');
  expect(screen.queryByRole('link', { name: 'Thử nạp lại' })).not.toBeInTheDocument();
});

test('a failed top-up result shows the server message and lets the user try again', () => {
  renderAt(<TopUpResult />, '/wallet/topup/result?success=false&message=Ng%C3%A2n%20h%C3%A0ng%20t%E1%BB%AB%20ch%E1%BB%91i');

  expect(screen.getByRole('heading', { name: 'Thanh toán chưa thành công' })).toBeInTheDocument();
  expect(screen.getByText('Ngân hàng từ chối')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Thử nạp lại' })).toHaveAttribute('href', '/wallet/topup');
});

test('the VNPay success page lists the amount, the note and the transaction code', () => {
  renderAt(<VNPaySuccess />, '/wallet/vnpay-success?amount=250000&orderInfo=Nap%20vi&transactionId=TX123');

  expect(screen.getByRole('heading', { name: 'Thanh toán thành công' })).toBeInTheDocument();
  expect(screen.getByText('250.000 VND')).toBeInTheDocument();
  expect(screen.getByText('Nap vi')).toBeInTheDocument();
  expect(screen.getByText('TX123')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Nạp thêm' })).toHaveAttribute('href', '/wallet/topup');
});

test('the VNPay success page hides the details block when nothing was passed', () => {
  renderAt(<VNPaySuccess />, '/wallet/vnpay-success');
  expect(screen.getByText('Nạp tiền thành công vào ví của bạn.')).toBeInTheDocument();
  expect(screen.queryByText('Số tiền nạp')).not.toBeInTheDocument();
});
