import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Home from '../modules/home/Home';
import Chat from '../modules/chat/Chat';
import Login from '../modules/auth/Login';
import Register from '../modules/auth/Register';
import ForgotPassword from '../modules/auth/ForgotPassword';
import Profile from '../modules/profile/Profile';
import EditProfile from '../modules/profile/EditProfile';
import ChangePassword from '../modules/profile/ChangePassword';
import UserProfile from '../modules/profile/UserProfile';
import UserReviews from '../modules/profile/UserReviews';
import AdminLayout from '../modules/admin/layout/AdminLayout';
import AdminDashboard from '../modules/admin/dashboard/Dashboard';
import UserManagement from '../modules/admin/users/UserManagement';
import ModeratorLayout from '../modules/moderator/layout/ModeratorLayout';
import ModProfile from '../modules/moderator/profile/ModProfile';
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import ModeratorRoute from './ModeratorRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="/user/:userId/reviews" element={<UserReviews />} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
      </Route>
      <Route path="/moderator" element={<ModeratorRoute><ModeratorLayout /></ModeratorRoute>}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="dashboard" element={<Navigate to="../profile" replace />} />
        <Route path="profile" element={<ModProfile />} />
      </Route>
      <Route path="*" element={<section><h1>Không tìm thấy trang</h1><Link to="/">Về trang chủ</Link></section>} />
    </Routes>
  );
}
