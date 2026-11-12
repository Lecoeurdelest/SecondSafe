import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Dashboard.css';
import { Avatar, Breadcrumb, Menu, Typography } from 'antd';
import { ArrowUpRight, Clock, LockKey, Package, SquaresFour } from '@phosphor-icons/react';

export default function DashboardLayout({ role, title, description, children }) {
  const isAdmin = role === 'admin';
  const { pathname } = useLocation();
  const isProductsPage = pathname === '/admin/products';

  const menuItems = [
    {
      type: 'group',
      label: 'KHÔNG GIAN LÀM VIỆC',
      children: [
        { key: 'overview', icon: <SquaresFour />, label: <Link to={isAdmin ? '/admin' : '/staff'}>Tổng quan</Link> },
        ...(isAdmin ? [{ key: 'products', icon: <Package />, label: <Link to="/admin/products">Quản lý sản phẩm</Link> }] : [])
      ]
    },
    {
      type: 'group',
      label: 'TRUY CẬP NHANH',
      children: [
        { key: 'shop', icon: <ArrowUpRight />, label: <Link to="/">Về trang mua sắm</Link> },
        { key: 'security', icon: <LockKey />, label: <Link to="/change-password">Bảo mật tài khoản</Link> }
      ]
    }
  ];

  return (
    <div className={`dashboard-shell ${isAdmin ? 'dashboard-shell--admin' : 'dashboard-shell--staff'}`}>
      <aside className="dashboard-sidebar">
        <Link className="dashboard-sidebar__brand" to="/">
          <span className="dashboard-sidebar__brand-mark" aria-hidden="true">S</span>
          <span className="dashboard-sidebar__brand-name">SecondSafe<small>Quản trị &amp; vận hành</small></span>
        </Link>
        <Menu
          className="dashboard-sidebar__menu"
          mode="inline"
          selectedKeys={[isProductsPage ? 'products' : 'overview']}
          items={menuItems}
        />
        <div className="dashboard-sidebar__profile">
          <Avatar>{isAdmin ? 'A' : 'S'}</Avatar>
          <div className="dashboard-sidebar__profile-copy">
            <strong>{isAdmin ? 'Quản trị viên' : 'Nhân viên'}</strong>
            <span>{isAdmin ? 'Quản lý nền tảng' : 'Điều phối vận hành'}</span>
          </div>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <Breadcrumb items={[{ title: 'SecondSafe' }, { title: <strong>{isAdmin ? 'Quản trị' : 'Nhân viên'}</strong> }]} />
          <Link className="dashboard-topbar__link" to="/">
            Về cửa hàng <span aria-hidden="true"><ArrowUpRight /></span>
          </Link>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div className="dashboard-heading__copy">
              <Typography.Text type="secondary" className="dashboard-eyebrow">{isAdmin ? 'TỔNG QUAN NỀN TẢNG' : 'TRUNG TÂM ĐIỀU PHỐI'}</Typography.Text>
              <Typography.Title level={1}>{title}</Typography.Title>
              <Typography.Paragraph type="secondary" className="dashboard-heading__description">{description}</Typography.Paragraph>
            </div>
            <div className="dashboard-heading__date">
              <span aria-hidden="true"><Clock /></span>
              {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date())}
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
