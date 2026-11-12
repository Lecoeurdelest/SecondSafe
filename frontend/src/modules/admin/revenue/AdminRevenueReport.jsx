import React, { useEffect, useMemo, useState } from 'react';
import { getModeratorRevenueReport } from '../../../services/moderator.service';
import {
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import './AdminRevenueReport.css';
import { Alert, Button, Card, Col, Empty, Flex, Input, Row, Spin, Statistic, Table, Typography } from 'antd';
import { ArrowClockwise, Funnel } from '@phosphor-icons/react';

const AdminRevenueReport = () => {
  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(
    () => new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10),
    [today]
  );
  const defaultTo = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(value || 0));

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN');
  };

  const formatCompactCurrencyTick = (value) => {
    const amount = Number(value || 0);
    if (Math.abs(amount) >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    }
    if (Math.abs(amount) >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return `${amount}`;
  };

  const fetchRevenueReport = async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const data = await getModeratorRevenueReport({ from, to });
      setReport(data);
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueReport(defaultFrom, defaultTo);
  }, [defaultFrom, defaultTo]);

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) {
      setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
      return;
    }
    if (fromDate > toDate) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }
    fetchRevenueReport(fromDate, toDate);
  };

  const handleResetFilter = () => {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    fetchRevenueReport(defaultFrom, defaultTo);
  };

  const summary = report?.summary || {
    completedOrders: 0,
    grossRevenue: 0,
    platformRevenue: 0,
    sellerPayout: 0
  };

  const monthlyChartData = (report?.breakdown || []).map((item) => {
    const periodRaw = String(item.period || '');
    let periodLabel = periodRaw;

    if (/^\d{4}-\d{2}$/.test(periodRaw)) {
      const [year, month] = periodRaw.split('-');
      periodLabel = `${month}/${year}`;
    }

    return {
      ...item,
      grossRevenue: Number(item.grossRevenue || 0),
      systemRevenue: Number(item.platformRevenue || 0),
      periodLabel
    };
  });

  const topProductChartData = (report?.topProducts || []).slice(0, 6).map((item) => ({
    name: String(item.title || 'N/A').slice(0, 18),
    grossRevenue: Number(item.grossRevenue || 0),
    platformRevenue: Number(item.platformRevenue || 0),
    sellerPayout: Number(item.sellerPayout || 0),
    completedOrders: Number(item.completedOrders || 0)
  }));

  const recentOrdersChartData = (report?.recentOrders || []).slice(0, 8).map((item) => ({
    orderCode: (item.orderCode || String(item.orderId || '').slice(-8)).toUpperCase(),
    grossRevenue: Number(item.grossRevenue || 0),
    platformRevenue: Number(item.platformRevenue || 0),
    sellerPayout: Number(item.sellerPayout || 0)
  }));

  const revenueSplitData = [
    { name: 'Phí hệ thống', value: Number(summary.platformRevenue || 0) },
    { name: 'Chi trả người bán', value: Number(summary.sellerPayout || 0) }
  ];

  const platformRatePercent = summary.grossRevenue > 0
    ? (Number(summary.platformRevenue || 0) / Number(summary.grossRevenue || 1)) * 100
    : 0;

  const splitColors = ['#ef4444', '#22c55e'];

  const countText = (value) => Number(value || 0).toLocaleString('vi-VN');
  const money = (value) => formatCurrency(value);
  const tableText = { emptyText: 'Không có dữ liệu' };

  const monthlyColumns = [
    { title: 'Kỳ', dataIndex: 'period' },
    { title: 'Số đơn', dataIndex: 'completedOrders', render: countText },
    { title: 'Doanh thu gộp', dataIndex: 'grossRevenue', render: money },
    { title: 'Doanh thu hệ thống', dataIndex: 'platformRevenue', render: money },
    { title: 'Chi trả người bán', dataIndex: 'sellerPayout', render: money }
  ];

  const productColumns = [
    { title: 'Sản phẩm', dataIndex: 'title' },
    ...monthlyColumns.slice(1)
  ];

  const recentColumns = [
    { title: 'Mã đơn', key: 'code', render: (_, order) => order.orderCode || String(order.orderId).slice(-8).toUpperCase() },
    { title: 'Sản phẩm', dataIndex: 'productTitle' },
    { title: 'Người mua', dataIndex: 'buyerName' },
    { title: 'Người bán', dataIndex: 'sellerName' },
    { title: 'Doanh thu gộp', dataIndex: 'grossRevenue', render: money },
    { title: 'Doanh thu hệ thống', dataIndex: 'platformRevenue', render: money },
    { title: 'Chi trả người bán', dataIndex: 'sellerPayout', render: money },
    { title: 'Hoàn tất lúc', dataIndex: 'completedAt', render: formatDateTime }
  ];

  const overview = [
    { key: 'orders', title: 'Tổng đơn hoàn tất', value: countText(summary.completedOrders), meta: 'Đơn đã hoàn thành trong kỳ lọc' },
    { key: 'gross', title: 'Doanh thu gộp', value: formatCurrency(summary.grossRevenue), meta: 'Tổng tiền người mua đã thanh toán' },
    { key: 'system', title: 'Doanh thu hệ thống (5%)', value: formatCurrency(summary.platformRevenue), meta: `Tỷ lệ thực tế: ${platformRatePercent.toFixed(2)}%` },
    { key: 'seller', title: 'Chi trả người bán (95%)', value: formatCurrency(summary.sellerPayout), meta: 'Doanh thu chuyển về ví người bán' }
  ];

  const chartCard = (title, children) => (
    <Col xs={24} xl={12}>
      <Card className="revenue-card" title={<Typography.Title level={3}>{title}</Typography.Title>}>
        <div className="revenue-chart-wrap">{children}</div>
      </Card>
    </Col>
  );

  const noChartData = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu biểu đồ" />;

  return (
    <div className="admin-revenue-report">
      <Typography.Title level={1}>Báo cáo doanh thu</Typography.Title>

      {error && <Alert className="revenue-alert" type="error" showIcon closable role="alert" title={error} onClose={() => setError('')} />}

      <Card className="revenue-card revenue-filter-panel">
        <Flex wrap gap={16} align="flex-end">
          <div className="revenue-filter-field">
            <label htmlFor="revenue-from">Từ ngày</label>
            <Input id="revenue-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="revenue-filter-field">
            <label htmlFor="revenue-to">Đến ngày</label>
            <Input id="revenue-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <Flex gap={8}>
            <Button type="primary" icon={<Funnel />} onClick={handleApplyFilter}>Áp dụng</Button>
            <Button icon={<ArrowClockwise />} onClick={handleResetFilter}>Mặc định</Button>
          </Flex>
        </Flex>
      </Card>

      {loading ? (
        <Flex justify="center" gap={12} className="revenue-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải báo cáo...</Typography.Text>
        </Flex>
      ) : (
        <>
          <Row gutter={[16, 16]} className="revenue-overview">
            {overview.map(({ key, title, value, meta }) => (
              <Col key={key} xs={24} sm={12} xl={6}>
                <Card className={`revenue-card revenue-overview-card revenue-overview-card--${key}`}>
                  <Statistic title={title} value={value} formatter={(text) => text} />
                  <Typography.Text type="secondary">{meta}</Typography.Text>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]} className="revenue-charts">
            {chartCard('Xu hướng doanh thu theo tháng', (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grossRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="periodLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis yAxisId="gross" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={formatCompactCurrencyTick} />
                  <YAxis yAxisId="system" orientation="right" tick={{ fontSize: 12, fill: '#ef4444' }} tickFormatter={formatCompactCurrencyTick} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area yAxisId="gross" type="monotone" dataKey="grossRevenue" name="Doanh thu gộp" stroke="#111827" fill="url(#grossRevenueFill)" strokeWidth={2} />
                  <Line yAxisId="system" type="monotone" dataKey="systemRevenue" name="Doanh thu hệ thống" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ))}

            {chartCard('Cơ cấu phân bổ doanh thu', (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Pie data={revenueSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={52} label>
                    {revenueSplitData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={splitColors[index % splitColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ))}

            {chartCard('Top sản phẩm: cơ cấu doanh thu và số đơn', (report?.topProducts || []).length === 0 ? noChartData : (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={topProductChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="sellerPayout" name="Chi trả người bán" stackId="rev" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="platformRevenue" name="Doanh thu hệ thống" stackId="rev" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="completedOrders" name="Số đơn" stroke="#111827" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ))}

            {chartCard('Đơn hoàn tất gần đây: so sánh phân bổ tiền', (report?.recentOrders || []).length === 0 ? noChartData : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={recentOrdersChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="orderCode" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="grossRevenue" name="Doanh thu gộp" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="platformRevenue" name="Doanh thu hệ thống" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sellerPayout" name="Chi trả người bán" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ))}
          </Row>

          <Card className="revenue-card revenue-section" title={<Typography.Title level={3}>Doanh thu theo tháng</Typography.Title>}>
            <Table rowKey="period" columns={monthlyColumns} dataSource={report?.breakdown || []} pagination={false} locale={tableText} scroll={{ x: 'max-content' }} />
          </Card>

          <Card className="revenue-card revenue-section" title={<Typography.Title level={3}>Top sản phẩm mang doanh thu cao</Typography.Title>}>
            <Table rowKey={(item) => String(item.productId)} columns={productColumns} dataSource={report?.topProducts || []} pagination={false} locale={tableText} scroll={{ x: 'max-content' }} />
          </Card>

          <Card className="revenue-card revenue-section" title={<Typography.Title level={3}>Đơn hoàn tất gần đây</Typography.Title>}>
            <Table rowKey={(order) => String(order.orderId)} columns={recentColumns} dataSource={report?.recentOrders || []} pagination={false} locale={tableText} scroll={{ x: 'max-content' }} />
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminRevenueReport;
