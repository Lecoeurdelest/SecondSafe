import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Withdrawal from './Withdrawal';
import walletService from '../../services/wallet.service';
import AppProviders from '../../ui/AppProviders';

let mockUser = { _id: 'user-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/wallet.service', () => ({
  __esModule: true,
  default: { getBalance: jest.fn(), getTransactions: jest.fn(), createWithdrawal: jest.fn() }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const BALANCE = { balance: 1500000, availableWithdrawalBalance: 1300000, pendingWithdrawalAmount: 200000 };

function renderPage() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/wallet/withdraw']}>
        <Routes>
          <Route path="/wallet/withdraw" element={<Withdrawal />} />
          <Route path="/wallet" element={<h1>Ví của tôi</h1>} />
          <Route path="/login" element={<h1>Đăng nhập</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

async function ready() {
  await screen.findByRole('heading', { level: 1, name: 'Rút tiền từ ví' });
}

async function chooseBank(name) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Ngân hàng' }));
  fireEvent.click(await screen.findByText(name, { selector: '.ant-select-item-option-content' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { _id: 'user-1' };
  walletService.getBalance.mockResolvedValue(BALANCE);
  walletService.getTransactions.mockResolvedValue({ transactions: [] });
});

test('signed-out visitors are sent to the sign-in page', async () => {
  mockUser = null;
  renderPage();
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
});

test('shows the available balance, the pending warning and the recent requests that have bank details', async () => {
  walletService.getTransactions.mockResolvedValue({
    transactions: [
      { _id: 'w1', type: 'withdrawal', status: 'pending', amount: -200000, createdAt: '2026-11-10T08:00:00Z', metadata: { bankName: 'MBBank', bankAccount: '0123456', accountHolder: 'NGUYEN VAN A' } },
      { _id: 'w2', type: 'withdrawal', status: 'failed', amount: -100000, failureReason: 'Sai số tài khoản', createdAt: '2026-11-09T08:00:00Z', metadata: { bankName: 'ACB', bankAccount: '999999' } },
      { _id: 'w3', type: 'withdrawal', status: 'completed', amount: -50000, createdAt: '2026-11-08T08:00:00Z', metadata: {} }
    ]
  });
  renderPage();
  await ready();

  expect(screen.getByText('1.300.000 VNĐ')).toBeInTheDocument();
  expect(screen.getByText('Số dư ví: 1.500.000 VNĐ')).toBeInTheDocument();
  expect(screen.getByText(/Hiện có 200\.000 VNĐ đang chờ xử lý/)).toBeInTheDocument();
  expect(await screen.findByText('2 giao dịch hợp lệ')).toBeInTheDocument();
  expect(screen.getByText('Ngân hàng: MBBank - 0123456')).toBeInTheDocument();
  expect(screen.getByText('Chủ TK: NGUYEN VAN A')).toBeInTheDocument();
  expect(screen.getByText('Bạn rút tiền không thành công')).toBeInTheDocument();
  expect(screen.getByText('Lý do: Sai số tài khoản')).toBeInTheDocument();
  expect(screen.getByText('Từ chối', { selector: '.ant-tag' })).toBeInTheDocument();
});

test('quick amounts fill the field and "Tất cả" uses the whole available balance', async () => {
  renderPage();
  await ready();
  expect(screen.getByRole('button', { name: 'Tạo yêu cầu rút tiền' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: '500,000 VNĐ' }));
  expect(screen.getByLabelText('Số tiền (VNĐ)')).toHaveValue('500000');
  expect(screen.getByText('Thông tin rút tiền')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
  expect(screen.getByLabelText('Số tiền (VNĐ)')).toHaveValue('1300000');
  expect(screen.getByRole('button', { name: 'Tạo yêu cầu rút tiền' })).toBeEnabled();
});

test('an empty submit shows every inline error and sends nothing', async () => {
  renderPage();
  await ready();

  fireEvent.change(screen.getByLabelText('Số tiền (VNĐ)'), { target: { value: '60000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu rút tiền' }));

  expect(await screen.findByText('Vui lòng chọn ngân hàng')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập số tài khoản')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập tên chủ tài khoản')).toBeInTheDocument();
  expect(walletService.createWithdrawal).not.toHaveBeenCalled();
});

test('an amount above the available balance is refused and a short account number is flagged', async () => {
  renderPage();
  await ready();

  fireEvent.change(screen.getByLabelText('Số tiền (VNĐ)'), { target: { value: '1400000' } });
  fireEvent.change(screen.getByLabelText('Số tài khoản'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu rút tiền' }));

  expect(await screen.findByText('Số tiền rút không được vượt quá số dư khả dụng')).toBeInTheDocument();
  expect(screen.getByText('Số tài khoản phải có ít nhất 6 ký tự')).toBeInTheDocument();
});

test('a valid request is sent with the bank details and returns to the wallet', async () => {
  walletService.createWithdrawal.mockResolvedValue({ success: true });
  renderPage();
  await ready();

  fireEvent.change(screen.getByLabelText('Số tiền (VNĐ)'), { target: { value: '300000' } });
  await chooseBank('MBBank');
  fireEvent.change(screen.getByLabelText('Số tài khoản'), { target: { value: '0123456789' } });
  fireEvent.change(screen.getByLabelText('Tên chủ tài khoản'), { target: { value: 'NGUYEN VAN A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu rút tiền' }));

  expect(await screen.findByRole('heading', { name: 'Ví của tôi' })).toBeInTheDocument();
  expect(walletService.createWithdrawal).toHaveBeenCalledWith({
    amount: 300000,
    bankAccount: { bankName: 'MBBank', accountNumber: '0123456789', accountName: 'NGUYEN VAN A' }
  });
});

test('a rejected request shows the server message and keeps the form', async () => {
  walletService.createWithdrawal.mockRejectedValue({ response: { data: { message: 'Vượt hạn mức rút trong ngày.' } } });
  renderPage();
  await ready();

  fireEvent.change(screen.getByLabelText('Số tiền (VNĐ)'), { target: { value: '300000' } });
  await chooseBank('ACB');
  fireEvent.change(screen.getByLabelText('Số tài khoản'), { target: { value: '0123456789' } });
  fireEvent.change(screen.getByLabelText('Tên chủ tài khoản'), { target: { value: 'NGUYEN VAN A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu rút tiền' }));

  expect(await screen.findByText('Vượt hạn mức rút trong ngày.')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tạo yêu cầu rút tiền' })).toBeEnabled());
  expect(screen.getByLabelText('Số tài khoản')).toHaveValue('0123456789');
});
