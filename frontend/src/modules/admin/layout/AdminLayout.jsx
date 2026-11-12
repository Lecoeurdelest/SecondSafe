import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import staffTheme, { staffLocale } from '../../staffTheme';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';
import '../../moderator/moderator-pages.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Check admin permission
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    if (user.role === 'moderator') {
      return <Navigate to="/moderator/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <ConfigProvider theme={staffTheme} locale={staffLocale}>
      <div className="admin-layout">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="admin-main">
          <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="admin-content">
            <Outlet />
          </main>
        </div>

        {sidebarOpen && (
          <div
            className="admin-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ConfigProvider>
  );
};

export default AdminLayout;