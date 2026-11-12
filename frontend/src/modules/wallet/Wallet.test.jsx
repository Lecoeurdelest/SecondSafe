import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Wallet from './Wallet';
import walletService from '../../services/wallet.service';
import AppProviders from '../../ui/AppProviders';

let mockUser = { _id: 'user-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/wallet.service', () => ({
  __esModule: true,
  default: { getBalance: jest.fn(), getTransactions: jest.fn() }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const BALANCE = { balance: 1500000, totalDeposited: 3000000, totalWithdrawn: 500000, pendingWithdrawalAmount: 200000, totalSpent: 800000, totalEarned: 100000 };

function tx(id, overrides = {}) {
  return { _id: id, type: 'deposit', status: 'completed', amount: 100000, description: 'Nạp qua SePay', createdAt: '2026-11-10T08:30:00Z', ...overrides };
}

function renderWallet() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/login" element={<h1>Đăng nhập</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { _id: 'user-1' };
  walletService.getBalance.mockResolvedValue(BALANCE);
  walletService.getTransactions.mockResolvedValue({ transactions: [tx('t1')], pagination: { total: 1, totalPages: 1 } });
});

test('signed-out visitors are sent to the sign-in page', async () => {
  mockUser = null;
  renderWallet();
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
});

test('shows the balance and the five totals', async () => {
  renderWallet();

  expect(await screen.findByRole('heading', { level: 1, name: 'Ví của tôi' })).toBeInTheDocument();
  expect(screen.getByText('Số dư khả dụng')).toBeInTheDocument();
  expect(screen.getAllByText(/1\.500\.000/).length).toBeGreaterThan(0);
  expect(screen.getByText('Tổng nạp:').closest('.ant-statistic')).toHaveTextContent(/3\.000\.000/);
  expect(screen.getByText('Tổng rút:').closest('.ant-statistic')).toHaveTextContent(/500\.000/);
  expect(screen.getByText('Đang chờ rút:').closest('.ant-statistic')).toHaveTextContent(/200\.000/);
  expect(screen.getByText('Tổng chi:').closest('.ant-statistic')).toHaveTextContent(/800\.000/);
  expect(screen.getByText('Tổng thu:').closest('.ant-statistic')).toHaveTextContent(/100\.000/);
  expect(screen.getByRole('link', { name: 'Rút tiền' })).toHaveAttribute('href', '/wallet/withdraw');
});

test('a failed balance load shows an alert that retries', async () => {
  walletService.getBalance.mockRejectedValueOnce(new Error('Không thể tải thông tin ví'));
  renderWallet();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Không thể tải thông tin ví');
  fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Ví của tôi' })).toBeInTheDocument();
});

test('completed credits are positive, completed debits negative and unfinished ones are marked as failed', async () => {
  walletService.getTransactions.mockResolvedValue({
    transactions: [
      tx('dep-ok'),
      tx('dep-pending', { status: 'pending', amount: 70000 }),
      tx('pay-ok', { type: 'payment', amount: -250000, description: '' }),
      tx('wd-pending', { type: 'withdrawal', status: 'pending', amount: -300000, metadata: { bankName: 'MBBank', bankAccount: '0123456', accountHolder: 'NGUYEN VAN A' } }),
      tx('wd-failed', { type: 'withdrawal', status: 'failed', amount: -400000, failureReason: 'Sai số tài khoản', metadata: { bankName: 'ACB', bankAccount: '999999' } }),
      tx('wd-orphan', { type: 'withdrawal', amount: -111111, metadata: {} })
    ],
    pagination: { total: 6, totalPages: 1 }
  });
  renderWallet();
  await screen.findByText('Nạp qua SePay');

  expect(screen.getByText(/^\+100\.000/)).toBeInTheDocument();
  expect(screen.getByText(/^0\s?₫|^0 ₫/)).toBeInTheDocument();
  expect(screen.getByText('70.000 ₫ nạp thất bại')).toBeInTheDocument();
  expect(screen.getByText(/^-250\.000/)).toBeInTheDocument();
  expect(screen.getAllByText(/\( không thành công\)/)).toHaveLength(2);
  expect(screen.getByText(/Ngân hàng: MBBank - 0123456/)).toBeInTheDocument();
  expect(screen.getByText('Chủ TK: NGUYEN VAN A')).toBeInTheDocument();
  expect(screen.getByText('Lý do: Sai số tài khoản')).toBeInTheDocument();
  expect(screen.getByText('Bạn rút tiền không thành công')).toBeInTheDocument();
  expect(screen.getByText('Đang xử lý', { selector: 'strong' })).toBeInTheDocument();
  expect(screen.queryByText(/111\.111/)).not.toBeInTheDocument();
  expect(screen.getAllByText('Hoàn thành', { selector: '.ant-tag' })).toHaveLength(2);
  expect(screen.getAllByText('Thất bại', { selector: '.ant-tag' })).toHaveLength(1);
});

test('an empty history says so', async () => {
  walletService.getTransactions.mockResolvedValue({ transactions: [], pagination: { total: 0, totalPages: 0 } });
  renderWallet();
  expect(await screen.findByText('Chưa có giao dịch nào')).toBeInTheDocument();
});

test('the type and date filters restart the history from the first page', async () => {
  renderWallet();
  await screen.findByText('Nạp qua SePay');

  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Lọc theo loại giao dịch' }));
  fireEvent.click(await screen.findByText('Rút tiền', { selector: '.ant-select-item-option-content' }));
  await waitFor(() => expect(walletService.getTransactions).toHaveBeenLastCalledWith({ page: 1, limit: 10, type: 'withdrawal', startDate: '', endDate: '' }));

  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-11-01' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-11-12' } });
  await waitFor(() => expect(walletService.getTransactions).toHaveBeenLastCalledWith({ page: 1, limit: 10, type: 'withdrawal', startDate: '2026-11-01', endDate: '2026-11-12' }));
});

test('a long history is paged', async () => {
  walletService.getTransactions
    .mockResolvedValueOnce({ transactions: [tx('a')], pagination: { total: 25, totalPages: 3 } })
    .mockResolvedValueOnce({ transactions: [tx('b', { description: 'Trang hai' })], pagination: { total: 25, totalPages: 3 } });
  renderWallet();
  await screen.findByText('Nạp qua SePay');

  fireEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(walletService.getTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 10 })));
  expect(await screen.findByText('Trang hai')).toBeInTheDocument();
});
