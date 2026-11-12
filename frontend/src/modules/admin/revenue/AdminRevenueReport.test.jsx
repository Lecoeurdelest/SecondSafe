import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminRevenueReport from './AdminRevenueReport';
import { getModeratorRevenueReport } from '../../../services/moderator.service';

jest.mock('../../../services/moderator.service', () => ({ getModeratorRevenueReport: jest.fn() }));
jest.mock('recharts', () => {
  const Pass = ({ children }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Pass, ComposedChart: Pass, PieChart: Pass, BarChart: Pass, Pie: Pass,
    Area: () => null, Line: () => null, Bar: () => null, Cell: () => null, CartesianGrid: () => null,
    XAxis: () => null, YAxis: () => null, Tooltip: () => null, Legend: () => null
  };
});

const REPORT = {
  summary: { completedOrders: 12, grossRevenue: 10000000, platformRevenue: 500000, sellerPayout: 9500000 },
  breakdown: [{ period: '2026-10', completedOrders: 7, grossRevenue: 6000000, platformRevenue: 300000, sellerPayout: 5700000 }],
  topProducts: [{ productId: 'p1', title: 'iPhone 13 Pro', completedOrders: 3, grossRevenue: 4000000, platformRevenue: 200000, sellerPayout: 3800000 }],
  recentOrders: [{ orderId: 'abcdef1234567890', orderCode: 'ss2001', productTitle: 'Máy ảnh film', buyerName: 'Nguyễn Văn An', sellerName: 'Trần Thị Bích', grossRevenue: 520000, platformRevenue: 26000, sellerPayout: 494000, completedAt: '2026-11-05T08:00:00.000Z' }]
};

beforeEach(() => {
  jest.clearAllMocks();
  getModeratorRevenueReport.mockResolvedValue(REPORT);
});

test('shows the revenue summary, the three tables and loads the year to date by default', async () => {
  render(<AdminRevenueReport />);

  expect(await screen.findByText('Tổng đơn hoàn tất')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Báo cáo doanh thu' })).toBeInTheDocument();
  expect(screen.getByText('12')).toBeInTheDocument();
  expect(screen.getByText(/10\.000\.000/, { selector: '.ant-statistic-content-value' })).toBeInTheDocument();
  expect(screen.getByText('Tỷ lệ thực tế: 5.00%')).toBeInTheDocument();

  expect(screen.getByText('2026-10')).toBeInTheDocument();
  expect(screen.getByText('iPhone 13 Pro', { selector: 'td' })).toBeInTheDocument();
  expect(screen.getByText('ss2001')).toBeInTheDocument();
  expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();

  const year = new Date().getFullYear();
  expect(getModeratorRevenueReport).toHaveBeenCalledWith({ from: `${year}-01-01`, to: new Date().toISOString().slice(0, 10) });
});

test('applying a filter asks for that range and resetting restores the default one', async () => {
  render(<AdminRevenueReport />);
  await screen.findByText('Tổng đơn hoàn tất');

  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-02-01' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-03-31' } });
  fireEvent.click(screen.getByRole('button', { name: /Áp dụng/ }));
  await waitFor(() => expect(getModeratorRevenueReport).toHaveBeenLastCalledWith({ from: '2026-02-01', to: '2026-03-31' }));

  fireEvent.click(screen.getByRole('button', { name: /Mặc định/ }));
  await waitFor(() => expect(screen.getByLabelText('Từ ngày')).toHaveValue(`${new Date().getFullYear()}-01-01`));
  expect(getModeratorRevenueReport).toHaveBeenCalledTimes(3);
});

test('an incomplete or reversed range is rejected without asking the server, and the alert can be closed', async () => {
  render(<AdminRevenueReport />);
  await screen.findByText('Tổng đơn hoàn tất');

  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: /Áp dụng/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');

  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-05-01' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-04-01' } });
  fireEvent.click(screen.getByRole('button', { name: /Áp dụng/ }));
  expect(await screen.findByText('Ngày bắt đầu không được lớn hơn ngày kết thúc')).toBeInTheDocument();
  expect(getModeratorRevenueReport).toHaveBeenCalledTimes(1);

  fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: /close/i }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});

test('a failed request shows the reason, and empty data says so in every table and chart', async () => {
  getModeratorRevenueReport.mockRejectedValueOnce(new Error('Không có quyền'));
  const { unmount } = render(<AdminRevenueReport />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền');
  unmount();

  getModeratorRevenueReport.mockResolvedValue({ summary: { completedOrders: 0, grossRevenue: 0, platformRevenue: 0, sellerPayout: 0 }, breakdown: [], topProducts: [], recentOrders: [] });
  render(<AdminRevenueReport />);
  await screen.findByText('Tổng đơn hoàn tất');
  expect(screen.getAllByText('Không có dữ liệu')).toHaveLength(3);
  expect(screen.getAllByText('Không có dữ liệu biểu đồ')).toHaveLength(2);
  expect(screen.getByText('Tỷ lệ thực tế: 0.00%')).toBeInTheDocument();
});

test('shows a status while the report loads', async () => {
  let resolve;
  getModeratorRevenueReport.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  render(<AdminRevenueReport />);

  expect(screen.getByRole('status')).toHaveTextContent('Đang tải báo cáo...');
  resolve(REPORT);
  expect(await screen.findByText('Tổng đơn hoàn tất')).toBeInTheDocument();
});
