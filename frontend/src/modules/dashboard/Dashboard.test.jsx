import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import dashboardService from '../../services/dashboard.service';
import abandonedCheckoutService from '../../services/abandonedCheckout.service';

jest.mock('../../services/dashboard.service', () => ({
  __esModule: true,
  default: { getAdminDashboard: jest.fn(), getStaffDashboard: jest.fn() }
}));
jest.mock('../../services/abandonedCheckout.service', () => ({
  __esModule: true,
  default: { getSummary: jest.fn() }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

const ADMIN = {
  generatedAt: '2026-10-27T00:00:00.000Z',
  users: { total: 5, byRole: { user: 4 } },
  products: { total: 10, byStatus: { active: 6, hidden: 1 }, byCategory: [{ category: 'Sách', count: 4 }, { category: 'Đồ điện tử', count: 2 }] },
  orders: { total: 4, byStatus: { completed: 2, paid: 1 }, monthly: [{ month: '2026-10', count: 2 }] },
  purchaseRequests: { byStatus: { pending: 2 } },
  reports: { byStatus: { pending: 1, reviewing: 2 } },
  disputes: { byStatus: { investigating: 1, resolved: 3 } },
  transactions: { feeRevenueVnd: 15000 },
  pendingWithdrawals: 3,
  wallets: { total: 5 }
};

const STAFF = {
  generatedAt: '2026-10-27T00:00:00.000Z',
  openDisputes: 1,
  pendingPurchaseRequests: 2,
  openOrders: 3,
  activeDeliveries: 4,
  recentQueue: [{ label: 'Tranh chấp cần xem xét', count: 1 }, { label: 'Báo cáo chờ xử lý', count: 0 }]
};

function renderDashboard(role, path = role === 'admin' ? '/admin' : '/staff') {
  return render(
    <MemoryRouter initialEntries={[path]} future={future}>
      <Dashboard role={role} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  dashboardService.getAdminDashboard.mockResolvedValue(ADMIN);
  dashboardService.getStaffDashboard.mockResolvedValue(STAFF);
  abandonedCheckoutService.getSummary.mockRejectedValue(new Error('Không có quyền'));
});

test('the admin overview shows the platform metrics, the charts and the attention list', async () => {
  renderDashboard('admin');

  expect(await screen.findByRole('heading', { level: 1, name: 'Bức tranh toàn cảnh' })).toBeInTheDocument();
  expect(await screen.findByText('15.000 ₫')).toBeInTheDocument();
  expect(screen.getByText('4 người mua / người bán')).toBeInTheDocument();
  expect(screen.getByText('6 sản phẩm đang bán')).toBeInTheDocument();
  expect(screen.getByText('2 đơn hoàn tất')).toBeInTheDocument();
  expect(screen.getByText('2026-10')).toBeInTheDocument();
  expect(screen.getByText('Đồ điện tử')).toBeInTheDocument();
  expect(screen.getByText('Hoàn tất')).toBeInTheDocument();
  expect(screen.getByText('Đang ẩn')).toBeInTheDocument();
  expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(5);

  const attention = screen.getByRole('heading', { name: 'Điểm cần chú ý' }).closest('.dashboard-panel');
  expect(within(attention).getByText('Tranh chấp cần xử lý').closest('.dashboard-alert-row')).toHaveTextContent('1');
  expect(within(attention).getByText('Yêu cầu mua đang chờ').closest('.dashboard-alert-row')).toHaveTextContent('2');
  expect(within(attention).getByText('Báo cáo chờ xử lý').closest('.dashboard-alert-row')).toHaveTextContent('3');
  expect(within(attention).getByText('Yêu cầu rút tiền').closest('.dashboard-alert-row')).toHaveTextContent('3');
  expect(screen.getByText(/Số liệu được lấy trực tiếp từ cơ sở dữ liệu/)).toBeInTheDocument();
});

test('the layout names the role, marks the current page and links back to the shop', async () => {
  renderDashboard('admin');
  await screen.findByRole('heading', { level: 1, name: 'Bức tranh toàn cảnh' });

  expect(screen.getByRole('link', { name: 'Tổng quan' }).closest('li')).toHaveClass('ant-menu-item-selected');
  expect(screen.getByRole('link', { name: 'Quản lý sản phẩm' })).toHaveAttribute('href', '/admin/products');
  expect(screen.getByRole('link', { name: 'Bảo mật tài khoản' })).toHaveAttribute('href', '/change-password');
  expect(screen.getByRole('link', { name: /Về cửa hàng/ })).toHaveAttribute('href', '/');
  expect(screen.getByText('Quản trị', { selector: 'strong' })).toBeInTheDocument();
  expect(screen.getByText('Quản trị viên')).toBeInTheDocument();
  expect(document.querySelector('.dashboard-sidebar__brand-mark')).toBeInTheDocument();
});

test('the staff overview has no admin-only menu, shows its metrics and the work queue with links', async () => {
  renderDashboard('moderator', '/staff');

  expect(await screen.findByRole('heading', { level: 1, name: 'Bảng điều phối' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Quản lý sản phẩm' })).not.toBeInTheDocument();
  expect(screen.getByText('Yêu cầu mua chờ')).toBeInTheDocument();
  expect(screen.getByText('Đơn chưa hoàn tất')).toBeInTheDocument();
  expect(screen.queryByText(/Phí nền tảng/)).not.toBeInTheDocument();
  expect(screen.getAllByText('Nhân viên', { selector: 'strong' })).toHaveLength(2);

  const queue = screen.getByRole('heading', { name: 'Hàng đợi vận hành' }).closest('.dashboard-panel');
  expect(within(queue).getByText('Cần chú ý', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(within(queue).getByText('Đã ổn định', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(within(queue).getByRole('link', { name: 'Tranh chấp' })).toHaveAttribute('href', '/moderator/disputes');
  expect(within(queue).getByRole('link', { name: 'Rút tiền' })).toHaveAttribute('href', '/moderator/withdrawals');
});

test('the abandoned checkout summary appears below the overview when it loads', async () => {
  const bucket = { total: 2, recovered: 1, lost: 0, active: 1, recoveredAmount: 50000, lostAmount: 0, activeAmount: 70000, recoveryRate: 100 };
  abandonedCheckoutService.getSummary.mockResolvedValue({ ...bucket, bySource: { order: bucket, cart: { ...bucket, total: 0 } } });
  renderDashboard('moderator', '/staff');

  expect(await screen.findByRole('heading', { name: 'Thanh toán dang dở' })).toBeInTheDocument();
  expect(screen.getByText('Tỷ lệ khôi phục 100%')).toBeInTheDocument();
  expect(screen.getByText(/Giá trị khôi phục 50\.000 ₫/)).toBeInTheDocument();
  expect(screen.getByText('Đã khôi phục')).toBeInTheDocument();
});

test('a failed load shows an alert with a way back, and a status while loading', async () => {
  let resolve;
  dashboardService.getAdminDashboard.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const { unmount } = renderDashboard('admin');
  expect(screen.getByRole('status')).toHaveTextContent('Đang tải dữ liệu dashboard…');
  resolve(ADMIN);
  await screen.findByText('15.000 ₫');
  unmount();

  dashboardService.getAdminDashboard.mockRejectedValue(new Error('Không thể kết nối'));
  renderDashboard('admin');
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Chưa tải được dữ liệu');
  expect(alert).toHaveTextContent('Không thể kết nối');
  expect(within(alert).getByRole('link', { name: 'Quay lại trang chủ' })).toHaveAttribute('href', '/');
  expect(within(alert).getByRole('button', { name: 'Thử tải lại' })).toBeInTheDocument();
});

test('empty charts say there is no data yet', async () => {
  dashboardService.getAdminDashboard.mockResolvedValue({ ...ADMIN, orders: { total: 0, byStatus: {}, monthly: [] }, products: { total: 0, byStatus: {}, byCategory: [] } });
  renderDashboard('admin');

  await screen.findByText('15.000 ₫');
  expect(screen.getAllByText('Chưa có dữ liệu trong kỳ này.').length).toBeGreaterThanOrEqual(3);
  fireEvent.click(screen.getByRole('link', { name: 'Về trang mua sắm' }));
});
