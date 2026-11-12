import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageLoading from '../ui/PageLoading';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Hien thi trang thai tai trong luc kiem tra dang nhap
  if (loading) {
    return <PageLoading />;
  }

  // Chuyen ve trang dang nhap neu chua xac thuc
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Hien thi component duoc bao ve neu da xac thuc
  return children;
}

export default ProtectedRoute;
