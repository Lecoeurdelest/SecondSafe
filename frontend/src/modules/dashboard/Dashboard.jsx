import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import dashboardService from '../../services/dashboard.service';
import './Dashboard.css';

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
    <article className={`dashboard-metric dashboard-metric--${tone}`}>
      <div className="dashboard-metric__top"><span>{label}</span><span className="dashboard-metric__icon" aria-hidden="true">{icon}</span></div>
      <strong>{value}</strong><small>{hint}</small>
    </article>
  );
}

function Bars({ items, valueLabel = item => formatNumber(item.count), nameLabel = item => item.label, currency = false }) {
  const max = Math.max(...items.map(item => item.count), 1);
  if (!items.length) return <p className="dashboard-empty">Chưa có dữ liệu trong kỳ này.</p>;
  return (
    <div className="dashboard-bars">
      {items.map(item => (
        <div className="dashboard-bar-row" key={item.label}>
          <span>{nameLabel(item)}</span>
          <div className="dashboard-bar-track"><i style={{ width: `${Math.max((item.count / max) * 100, item.count ? 5 : 0)}%` }} /></div>
          <strong>{currency ? formatVnd(item.count) : valueLabel(item)}</strong>
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

function AdminOverview({ data }) {
  const monthly = (data.orders.monthly || []).map(item => ({ label: item.month, count: item.count }));
  const categories = (data.products.byCategory || []).map(item => ({ label: item.category, count: item.count }));
  const orderStatus = statusItems(data.orders.byStatus).map(item => ({ ...item, label: statusLabel(item.label) }));
  const productStatus = statusItems(data.products.byStatus).map(item => ({ ...item, label: statusLabel(item.label) }));
  return (
    <>
      <div className="dashboard-metrics">
        <MetricCard icon="♙" label="Tài khoản" value={formatNumber(data.users.total)} hint={`${formatNumber(data.users.byRole?.user || 0)} người mua / người bán`} tone="blue" />
        <MetricCard icon="◇" label="Sản phẩm" value={formatNumber(data.products.total)} hint={`${formatNumber(data.products.byStatus?.active || 0)} sản phẩm đang bán`} tone="purple" />
        <MetricCard icon="▤" label="Đơn hàng" value={formatNumber(data.orders.total)} hint={`${formatNumber(data.orders.byStatus?.completed || 0)} đơn hoàn tất`} tone="green" />
        <MetricCard icon="₫" label="Phí nền tảng" value={formatVnd(data.transactions.feeRevenueVnd)} hint="Tổng phí giao dịch đã hoàn tất" tone="orange" />
      </div>
      <div className="dashboard-panels">
        <section className="dashboard-panel dashboard-panel--wide">
          <div className="dashboard-panel__heading"><div><h2>Nhịp giao dịch</h2><p>Số đơn hàng theo tháng</p></div><span className="dashboard-panel__tag">6 tháng gần nhất</span></div>
          <Bars items={monthly} />
        </section>
        <section className="dashboard-panel">
          <div className="dashboard-panel__heading"><div><h2>Danh mục nổi bật</h2><p>Sản phẩm theo danh mục</p></div><span aria-hidden="true">◉</span></div>
          <Bars items={categories} />
        </section>
        <section className="dashboard-panel">
          <div className="dashboard-panel__heading"><div><h2>Trạng thái đơn</h2><p>Tổng quan xử lý đơn hàng</p></div><span aria-hidden="true">↗</span></div>
          <Bars items={orderStatus} />
        </section>
        <section className="dashboard-panel">
          <div className="dashboard-panel__heading"><div><h2>Trạng thái sản phẩm</h2><p>Tình trạng đăng bán hiện tại</p></div><span aria-hidden="true">⌂</span></div>
          <Bars items={productStatus} />
        </section>
        <section className="dashboard-panel dashboard-panel--summary">
          <div className="dashboard-panel__heading"><div><h2>Điểm cần chú ý</h2><p>Chỉ số vận hành cần theo dõi</p></div></div>
          <div className="dashboard-alert-list">
            <div><span className="dashboard-alert-dot dashboard-alert-dot--red" />Tranh chấp cần xử lý<strong>{formatNumber(Object.entries(data.disputes.byStatus || {}).filter(([status]) => !['resolved', 'dismissed'].includes(status)).reduce((sum, [, count]) => sum + count, 0))}</strong></div>
            <div><span className="dashboard-alert-dot dashboard-alert-dot--amber" />Yêu cầu mua đang chờ<strong>{formatNumber(data.purchaseRequests.byStatus?.pending || 0)}</strong></div>
            <div><span className="dashboard-alert-dot dashboard-alert-dot--red" />Báo cáo chờ xử lý<strong>{formatNumber((data.reports?.byStatus?.pending || 0) + (data.reports?.byStatus?.reviewing || 0))}</strong></div>
            <div><span className="dashboard-alert-dot dashboard-alert-dot--amber" />Yêu cầu rút tiền<strong>{formatNumber(data.pendingWithdrawals)}</strong></div>
            <div><span className="dashboard-alert-dot dashboard-alert-dot--blue" />Ví người dùng<strong>{formatNumber(data.wallets.total)}</strong></div>
          </div>
        </section>
      </div>
      <p className="dashboard-footnote">Số liệu được lấy trực tiếp từ cơ sở dữ liệu lúc {dateLabel(data.generatedAt)}. Không hiển thị thông tin cá nhân.</p>
    </>
  );
}

function StaffOverview({ data }) {
  const queue = data.recentQueue || [];
  return (
    <>
      <div className="dashboard-metrics dashboard-metrics--staff">
        <MetricCard icon="⚑" label="Tranh chấp mở" value={formatNumber(data.openDisputes)} hint="Cần theo dõi và điều phối" tone="orange" />
        <MetricCard icon="↗" label="Yêu cầu mua chờ" value={formatNumber(data.pendingPurchaseRequests)} hint="Đang chờ phản hồi" tone="blue" />
        <MetricCard icon="▤" label="Đơn chưa hoàn tất" value={formatNumber(data.openOrders)} hint="Bao gồm đơn đang giao" tone="purple" />
        <MetricCard icon="⇢" label="Đang vận chuyển" value={formatNumber(data.activeDeliveries)} hint="Đang chuẩn bị hoặc giao hàng" tone="green" />
      </div>
      <section className="dashboard-panel dashboard-queue">
        <div className="dashboard-panel__heading"><div><h2>Hàng đợi vận hành</h2><p>Các nhóm việc đang chờ xử lý trong hệ thống</p></div><span className="dashboard-panel__tag">Tổng quan</span></div>
        <div className="dashboard-queue__list">
          {queue.map(item => (
            <div className="dashboard-queue__item" key={item.label}>
              <span className="dashboard-queue__icon" aria-hidden="true">◈</span>
              <span>{item.label}</span>
              <strong>{formatNumber(item.count)}</strong>
              <span className="dashboard-queue__status">{item.count ? 'Cần chú ý' : 'Đã ổn định'}</span>
            </div>
          ))}
        </div>
        <p className="dashboard-queue__note">Dashboard này chỉ hiển thị số liệu. Các thao tác xử lý tranh chấp/đơn hàng cần được bật ở các module nghiệp vụ tương ứng.</p>
      </section>
      <p className="dashboard-footnote">Số liệu được lấy trực tiếp từ cơ sở dữ liệu lúc {dateLabel(data.generatedAt)}. Nhân viên không xem số dư ví hoặc chi tiết giao dịch.</p>
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
      {loading && <p className="dashboard-state" role="status">Đang tải dữ liệu dashboard…</p>}
      {!loading && error && (
        <div className="dashboard-state dashboard-state--error" role="alert">
          <strong>Chưa tải được dữ liệu</strong><p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>Thử tải lại</button>
          <Link to="/">Quay lại trang chủ</Link>
        </div>
      )}
      {!loading && !error && data && (isAdmin ? <AdminOverview data={data} /> : <StaffOverview data={data} />)}
    </DashboardLayout>
  );
}
