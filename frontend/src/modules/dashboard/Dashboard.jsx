import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import LinkButton from '../../ui/LinkButton';
import dashboardService from '../../services/dashboard.service';
import abandonedCheckoutService from '../../services/abandonedCheckout.service';
import './Dashboard.css';
import { Alert, Avatar, Badge, Button, Card, Col, Empty, Flex, Progress, Row, Spin, Statistic, Tag, Typography } from 'antd';
import { ArrowUpRight, ChartPieSlice, CurrencyCircleDollar, Flag, House, ListChecks, Package, Receipt, Truck, Users } from '@phosphor-icons/react';

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function formatVnd(value) {
  return `${formatNumber(value)} ₫`;
}

function dateLabel(value) {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function MetricCard({ icon, label, value, hint, tone }) {
  return (
    <Card className={`dashboard-metric dashboard-metric--${tone}`}>
      <Flex justify="space-between" align="flex-start" gap={12}>
        <Statistic title={label} value={value} formatter={(text) => text} />
        <Avatar className="dashboard-metric__icon" size={40} icon={icon} aria-hidden="true" />
      </Flex>
      <Typography.Text type="secondary" className="dashboard-metric__hint">{hint}</Typography.Text>
    </Card>
  );
}

function Panel({ title, subtitle, extra, wide, headingId, children }) {
  return (
    <Col xs={24} lg={wide ? 24 : 12}>
      <Card
        className="dashboard-panel"
        aria-labelledby={headingId}
        title={(
          <div>
            <Typography.Title level={2} id={headingId}>{title}</Typography.Title>
            {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
          </div>
        )}
        extra={extra}
      >
        {children}
      </Card>
    </Col>
  );
}

function Bars({ items, valueLabel = item => formatNumber(item.count), nameLabel = item => item.label, currency = false }) {
  const max = Math.max(...items.map(item => item.count), 1);
  if (!items.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu trong kỳ này." />;
  return (
    <div className="dashboard-bars">
      {items.map(item => (
        <div className="dashboard-bar-row" key={item.label}>
          <Typography.Text className="dashboard-bar-row__name">{nameLabel(item)}</Typography.Text>
          <Progress
            percent={Math.max((item.count / max) * 100, item.count ? 5 : 0)}
            showInfo={false}
            size="small"
            aria-label={nameLabel(item)}
          />
          <Typography.Text strong className="dashboard-bar-row__value">{currency ? formatVnd(item.count) : valueLabel(item)}</Typography.Text>
        </div>
      ))}
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    available: 'Đang bán', active: 'Đang bán', reserved: 'Đang giữ chỗ', sold: 'Đã bán',
    completed: 'Hoàn tất', shipping: 'Đang giao', shipped: 'Đang giao hàng',
    delivered: 'Đã giao hàng', in_transit: 'Đang vận chuyển',
    paid: 'Đã thanh toán', disputed: 'Có tranh chấp', under_review: 'Đang xem xét',
    pending: 'Chờ xử lý', accepted: 'Đã chấp nhận', preparing: 'Đang chuẩn bị',
    cancelled: 'Đã hủy', awaiting_seller_confirmation: 'Chờ người bán xác nhận',
    awaiting_payment: 'Chờ thanh toán', investigating: 'Đang điều tra',
    resolved: 'Đã giải quyết', rejected: 'Đã từ chối', expired: 'Đã hết hạn',
    hidden: 'Đang ẩn', deleted: 'Đã xóa'
  };
  return labels[status] || status.replaceAll('_', ' ');
}

function statusItems(byStatus) {
  return Object.entries(byStatus || {}).map(([label, count]) => ({ label, count }));
}

const ALERT_COLORS = { red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6' };

function AlertRow({ color, label, value }) {
  return (
    <Flex justify="space-between" align="center" gap={12} className="dashboard-alert-row">
      <Badge color={ALERT_COLORS[color]} text={label} />
      <Typography.Text strong>{value}</Typography.Text>
    </Flex>
  );
}

function AdminOverview({ data }) {
  const monthly = (data.orders.monthly || []).map(item => ({ label: item.month, count: item.count }));
  const categories = (data.products.byCategory || []).map(item => ({ label: item.category, count: item.count }));
  const orderStatus = statusItems(data.orders.byStatus).map(item => ({ ...item, label: statusLabel(item.label) }));
  const productStatus = statusItems(data.products.byStatus).map(item => ({ ...item, label: statusLabel(item.label) }));
  const openDisputes = Object.entries(data.disputes.byStatus || {}).filter(([status]) => !['resolved', 'dismissed'].includes(status)).reduce((sum, [, count]) => sum + count, 0);
  return (
    <>
      <Row gutter={[16, 16]} className="dashboard-metrics">
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<Users />} label="Tài khoản" value={formatNumber(data.users.total)} hint={`${formatNumber(data.users.byRole?.user || 0)} người mua / người bán`} tone="blue" /></Col>
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<Package />} label="Sản phẩm" value={formatNumber(data.products.total)} hint={`${formatNumber(data.products.byStatus?.active || 0)} sản phẩm đang bán`} tone="purple" /></Col>
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<Receipt />} label="Đơn hàng" value={formatNumber(data.orders.total)} hint={`${formatNumber(data.orders.byStatus?.completed || 0)} đơn hoàn tất`} tone="green" /></Col>
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<CurrencyCircleDollar />} label="Phí nền tảng" value={formatVnd(data.transactions.feeRevenueVnd)} hint="Tổng phí giao dịch đã hoàn tất" tone="orange" /></Col>
      </Row>
      <Row gutter={[16, 16]} className="dashboard-panels">
        <Panel wide headingId="dashboard-monthly" title="Nhịp giao dịch" subtitle="Số đơn hàng theo tháng" extra={<Tag>6 tháng gần nhất</Tag>}>
          <Bars items={monthly} />
        </Panel>
        <Panel headingId="dashboard-categories" title="Danh mục nổi bật" subtitle="Sản phẩm theo danh mục" extra={<ChartPieSlice aria-hidden="true" />}>
          <Bars items={categories} />
        </Panel>
        <Panel headingId="dashboard-order-status" title="Trạng thái đơn" subtitle="Tổng quan xử lý đơn hàng" extra={<ArrowUpRight aria-hidden="true" />}>
          <Bars items={orderStatus} />
        </Panel>
        <Panel headingId="dashboard-product-status" title="Trạng thái sản phẩm" subtitle="Tình trạng đăng bán hiện tại" extra={<House aria-hidden="true" />}>
          <Bars items={productStatus} />
        </Panel>
        <Panel headingId="dashboard-attention" title="Điểm cần chú ý" subtitle="Chỉ số vận hành cần theo dõi">
          <Flex vertical gap={12}>
            <AlertRow color="red" label="Tranh chấp cần xử lý" value={formatNumber(openDisputes)} />
            <AlertRow color="amber" label="Yêu cầu mua đang chờ" value={formatNumber(data.purchaseRequests.byStatus?.pending || 0)} />
            <AlertRow color="red" label="Báo cáo chờ xử lý" value={formatNumber((data.reports?.byStatus?.pending || 0) + (data.reports?.byStatus?.reviewing || 0))} />
            <AlertRow color="amber" label="Yêu cầu rút tiền" value={formatNumber(data.pendingWithdrawals)} />
            <AlertRow color="blue" label="Ví người dùng" value={formatNumber(data.wallets.total)} />
          </Flex>
        </Panel>
      </Row>
      <Typography.Paragraph type="secondary" className="dashboard-footnote">Số liệu được lấy trực tiếp từ cơ sở dữ liệu lúc {dateLabel(data.generatedAt)}. Không hiển thị thông tin cá nhân.</Typography.Paragraph>
    </>
  );
}

// Loaded on its own so a failure here never hides the main dashboard.
function AbandonedCheckoutPanel() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let active = true;
    abandonedCheckoutService.getSummary()
      .then(result => { if (active) setSummary(result); })
      .catch(() => { if (active) setSummary(null); });
    return () => { active = false; };
  }, []);

  if (!summary) return null;
  return (
    <Row gutter={[16, 16]} className="dashboard-panels">
      <Panel
        wide
        headingId="abandoned-checkout-heading"
        title="Thanh toán dang dở"
        subtitle="Đơn quá hạn thanh toán và giỏ hàng bị bỏ quên"
        extra={<Tag>Tỷ lệ khôi phục {summary.recoveryRate}%</Tag>}
      >
        <Bars items={[
          { label: 'Đã khôi phục', count: summary.recovered },
          { label: 'Đang chờ người mua', count: summary.active },
          { label: 'Đã mất', count: summary.lost }
        ]} />
        <Typography.Paragraph type="secondary" className="dashboard-footnote">
          Giá trị khôi phục {formatVnd(summary.recoveredAmount)} · đang chờ {formatVnd(summary.activeAmount)} · đã mất {formatVnd(summary.lostAmount)}.
          Từ đơn hàng: {formatNumber(summary.bySource.order.total)} · từ giỏ hàng: {formatNumber(summary.bySource.cart.total)}.
        </Typography.Paragraph>
      </Panel>
    </Row>
  );
}

function StaffOverview({ data }) {
  const queue = data.recentQueue || [];
  return (
    <>
      <Row gutter={[16, 16]} className="dashboard-metrics">
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<Flag />} label="Tranh chấp mở" value={formatNumber(data.openDisputes)} hint="Cần theo dõi và điều phối" tone="orange" /></Col>
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<ArrowUpRight />} label="Yêu cầu mua chờ" value={formatNumber(data.pendingPurchaseRequests)} hint="Đang chờ phản hồi" tone="blue" /></Col>
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<Receipt />} label="Đơn chưa hoàn tất" value={formatNumber(data.openOrders)} hint="Bao gồm đơn đang giao" tone="purple" /></Col>
        <Col xs={24} sm={12} xl={6}><MetricCard icon={<Truck />} label="Đang vận chuyển" value={formatNumber(data.activeDeliveries)} hint="Đang chuẩn bị hoặc giao hàng" tone="green" /></Col>
      </Row>
      <Row gutter={[16, 16]} className="dashboard-panels">
        <Panel wide headingId="dashboard-queue" title="Hàng đợi vận hành" subtitle="Các nhóm việc đang chờ xử lý trong hệ thống" extra={<Tag>Tổng quan</Tag>}>
          <Flex vertical gap={10}>
            {queue.map(item => (
              <Flex key={item.label} align="center" gap={12} className="dashboard-queue__item">
                <ListChecks aria-hidden="true" />
                <Typography.Text className="dashboard-queue__label">{item.label}</Typography.Text>
                <Typography.Text strong>{formatNumber(item.count)}</Typography.Text>
                <Tag color={item.count ? 'warning' : 'success'}>{item.count ? 'Cần chú ý' : 'Đã ổn định'}</Tag>
              </Flex>
            ))}
          </Flex>
          <Typography.Paragraph className="dashboard-queue__note">
            Xử lý tại: <Link to="/moderator/reports">Báo cáo</Link> · <Link to="/moderator/disputes">Tranh chấp</Link> · <Link to="/moderator/orders">Đơn hàng</Link> · <Link to="/moderator/reviews">Đánh giá</Link> · <Link to="/moderator/withdrawals">Rút tiền</Link>
          </Typography.Paragraph>
        </Panel>
      </Row>
      <Typography.Paragraph type="secondary" className="dashboard-footnote">Số liệu được lấy trực tiếp từ cơ sở dữ liệu lúc {dateLabel(data.generatedAt)}. Nhân viên không xem số dư ví hoặc chi tiết giao dịch.</Typography.Paragraph>
    </>
  );
}

export default function Dashboard({ role }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = role === 'admin';

  useEffect(() => {
    let active = true;
    const load = isAdmin ? dashboardService.getAdminDashboard : dashboardService.getStaffDashboard;
    load()
      .then(result => { if (active) setData(result); })
      .catch(failure => { if (active) setError(failure.message || 'Không thể tải dashboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAdmin]);

  return (
    <DashboardLayout
      role={role}
      title={isAdmin ? 'Bức tranh toàn cảnh' : 'Bảng điều phối'}
      description={isAdmin ? 'Theo dõi sức khỏe sàn giao dịch và các chỉ số quan trọng.' : 'Ưu tiên công việc cần xử lý và theo dõi hoạt động gần đây.'}
    >
      {loading && (
        <Flex justify="center" gap={12} className="dashboard-state" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải dữ liệu dashboard…</Typography.Text>
        </Flex>
      )}
      {!loading && error && (
        <Alert
          className="dashboard-state"
          type="error"
          showIcon
          role="alert"
          title="Chưa tải được dữ liệu"
          description={error}
          action={(
            <Flex gap={8}>
              <Button size="small" type="primary" onClick={() => window.location.reload()}>Thử tải lại</Button>
              <LinkButton size="small" to="/">Quay lại trang chủ</LinkButton>
            </Flex>
          )}
        />
      )}
      {!loading && !error && data && (isAdmin ? <AdminOverview data={data} /> : <StaffOverview data={data} />)}
      {!loading && !error && data && <AbandonedCheckoutPanel />}
    </DashboardLayout>
  );
}
