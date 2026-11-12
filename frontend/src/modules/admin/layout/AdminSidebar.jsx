import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar, Button, Menu, Typography } from 'antd';
import { ChartLine, Gauge, Gavel, Flag, Money, ShoppingCart, Star, Users, X } from '@phosphor-icons/react';

const MENU_ITEMS = [
  { path: '/admin/dashboard', icon: Gauge, label: 'Tổng quan', description: 'Dashboard và thống kê' },
  { path: '/admin/revenue', icon: ChartLine, label: 'Báo cáo doanh thu', description: 'Thống kê phí 5% và chi trả' },
  { path: '/admin/users', icon: Users, label: 'Quản lý người dùng', description: 'CRUD người dùng hệ thống' },
  { path: '/admin/reports', icon: Flag, label: 'Quản lý báo cáo', description: 'Xử lý báo cáo từ người dùng' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Quản lý đơn hàng', description: 'Theo dõi và xử lý đơn hàng' },
  { path: '/admin/reviews', icon: Star, label: 'Đánh giá & Nhận xét', description: 'Quản lý đánh giá người dùng' },
  { path: '/admin/withdrawals', icon: Money, label: 'Duyệt rút tiền', description: 'Xử lý yêu cầu rút tiền' },
  { path: '/admin/disputes', icon: Gavel, label: 'Giải quyết tranh chấp', description: 'Xử lý tranh chấp đơn hàng' }
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    if (location.pathname.startsWith('/admin/reports')) return path === '/admin/reports';
    if (location.pathname.startsWith('/admin/orders')) return path === '/admin/orders';
    if (location.pathname.startsWith('/admin/reviews')) return path === '/admin/reviews';
    if (location.pathname.startsWith('/admin/withdrawals')) return path === '/admin/withdrawals';
    if (location.pathname.startsWith('/admin/disputes')) return path === '/admin/disputes';
    if (location.pathname.startsWith('/admin/revenue')) return path === '/admin/revenue';
    return location.pathname === path;
  };

  const items = MENU_ITEMS.map(({ path, icon: Icon, label, description }) => ({
    key: path,
    icon: <Icon />,
    label: (
      <Link to={path} onClick={onClose}>
        <span className="admin-sidebar__label">{label}</span>
        <small className="admin-sidebar__desc">{description}</small>
      </Link>
    )
  }));
  const selected = MENU_ITEMS.find(({ path }) => isActive(path));

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar__header">
        <div className="admin-brand">
          <Avatar shape="square" size={40} className="admin-brand-badge">A</Avatar>
          <div className="admin-brand-text">
            <Typography.Text strong className="admin-brand-title">Admin Panel</Typography.Text>
            <Typography.Text type="secondary" className="admin-brand-subtitle">Bảng điều hành quản trị</Typography.Text>
          </div>
        </div>
        <Button className="admin-sidebar__close" type="text" aria-label="Đóng menu" icon={<X />} onClick={onClose} />
      </div>

      <div className="admin-sidebar__user">
        <Avatar size={44} src={user?.avatar || '/images/placeholders/avatar-placeholder.svg'} alt={user?.fullName} />
        <div className="admin-sidebar__user-info">
          <Typography.Text strong>{user?.fullName}</Typography.Text>
          <Typography.Text type="secondary">Quản trị viên hệ thống</Typography.Text>
        </div>
      </div>

      <Menu
        className="admin-sidebar__menu"
        mode="inline"
        selectedKeys={selected ? [selected.path] : []}
        items={items}
      />
    </aside>
  );
};

export default AdminSidebar;
