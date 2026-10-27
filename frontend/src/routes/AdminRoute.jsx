import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    if (user.role === 'moderator') {
      return <Navigate to="/moderator/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;