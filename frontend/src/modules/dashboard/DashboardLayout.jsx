import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function DashboardLayout({ role, title, description, children }) {
  const isAdmin = role === 'admin';
  return (
    <div className={`dashboard-shell ${isAdmin ? 'dashboard-shell--admin' : 'dashboard-shell--staff'}`}>
      <aside className="dashboard-sidebar">
        <Link className="dashboard-sidebar__brand" to="/">
          <span className="dashboard-sidebar__brand-mark" aria-hidden="true">S</span>
          <span className="dashboard-sidebar__brand-name">SecondSafe<small>Quản trị &amp; vận hành</small></span>
        </Link>
        <div className="dashboard-sidebar__label">KHÔNG GIAN LÀM VIỆC</div>
        <Link className="dashboard-sidebar__item dashboard-sidebar__item--active" to={isAdmin ? '/admin' : '/staff'}>
          <span className="dashboard-sidebar__item-icon" aria-hidden="true">▦</span>
          <span>Tổng quan</span>
        </Link>
        <div className="dashboard-sidebar__label dashboard-sidebar__label--secondary">TRUY CẬP NHANH</div>
        <Link className="dashboard-sidebar__item" to="/">
          <span className="dashboard-sidebar__item-icon" aria-hidden="true">↗</span>
          <span>Về trang mua sắm</span>
        </Link>
        <Link className="dashboard-sidebar__item" to="/change-password">
          <span className="dashboard-sidebar__item-icon" aria-hidden="true">⌑</span>
          <span>Bảo mật tài khoản</span>
        </Link>
        <div className="dashboard-sidebar__profile">
          <div className="dashboard-sidebar__avatar">{isAdmin ? 'A' : 'S'}</div>
          <div className="dashboard-sidebar__profile-copy">
            <strong>{isAdmin ? 'Quản trị viên' : 'Nhân viên'}</strong>
            <span>{isAdmin ? 'Quản lý nền tảng' : 'Điều phối vận hành'}</span>
          </div>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__crumb">
            <span>SecondSafe</span><span aria-hidden="true">/</span><strong>{isAdmin ? 'Quản trị' : 'Nhân viên'}</strong>
          </div>
          <Link className="dashboard-topbar__link" to="/">
            Về cửa hàng <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div className="dashboard-heading__copy">
              <p className="dashboard-eyebrow">{isAdmin ? 'TỔNG QUAN NỀN TẢNG' : 'TRUNG TÂM ĐIỀU PHỐI'}</p>
              <h1>{title}</h1>
              <p className="dashboard-heading__description">{description}</p>
            </div>
            <div className="dashboard-heading__date">
              <span aria-hidden="true">◷</span>
              {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date())}
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
