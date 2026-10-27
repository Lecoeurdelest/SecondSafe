import React, { lazy } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Home from '../modules/home/Home';
import Assistant from '../modules/assistant/Assistant';
import Support from '../modules/support/Support';
import { getSession } from '../services/session.service';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import ModeratorRoute from './ModeratorRoute';

const Chat = lazy(() => import('../modules/chat/Chat'));
const ProductDetail = lazy(() => import('../modules/product/ProductDetail'));
const Cart = lazy(() => import('../modules/product/Cart'));
const Favorites = lazy(() => import('../modules/product/Favorites'));
const Login = lazy(() => import('../modules/auth/Login'));
const Register = lazy(() => import('../modules/auth/Register'));
const ForgotPassword = lazy(() => import('../modules/auth/ForgotPassword'));
const ChangePassword = lazy(() => import('../modules/auth/ChangePassword'));
const Dashboard = lazy(() => import('../modules/dashboard/Dashboard'));
const Profile = lazy(() => import('../modules/profile/Profile'));
const EditProfile = lazy(() => import('../modules/profile/EditProfile'));
const UserProfile = lazy(() => import('../modules/profile/UserProfile'));
const UserReviews = lazy(() => import('../modules/profile/UserReviews'));
const AdminLayout = lazy(() => import('../modules/admin/layout/AdminLayout'));
const UserManagement = lazy(() => import('../modules/admin/users/UserManagement'));
const ModeratorLayout = lazy(() => import('../modules/moderator/layout/ModeratorLayout'));
const ModProfile = lazy(() => import('../modules/moderator/profile/ModProfile'));

function DashboardRoute({ role, children }) {
  const session = getSession();
  if (!session.token) return <Navigate to="/login" replace />;
  if (session.role !== role && !(role === 'moderator' && session.role === 'admin')) {
    return <section className="welcome"><h1>Không có quyền truy cập</h1><p>Tài khoản này không được phép mở dashboard này.</p><Link to="/">Về trang chủ</Link></section>;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ChangePassword />} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="/user/:userId/reviews" element={<UserReviews />} />
      <Route path="/admin" element={<DashboardRoute role="admin"><Dashboard role="admin" /></DashboardRoute>} />
      <Route path="/admin/dashboard" element={<DashboardRoute role="admin"><Dashboard role="admin" /></DashboardRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<UserManagement />} />
      </Route>
      <Route path="/staff" element={<DashboardRoute role="moderator"><Dashboard role="moderator" /></DashboardRoute>} />
      <Route path="/moderator/dashboard" element={<DashboardRoute role="moderator"><Dashboard role="moderator" /></DashboardRoute>} />
      <Route path="/moderator" element={<ModeratorRoute><ModeratorLayout /></ModeratorRoute>}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ModProfile />} />
      </Route>
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/assistant/reports/:reportId" element={<DashboardRoute role="moderator"><Assistant moderation /></DashboardRoute>} />
      <Route path="/support" element={<Support />} />
      <Route path="/support/:conversationId" element={<Support />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:conversationId" element={<Chat />} />
      <Route path="*" element={<section className="welcome"><h1>Không tìm thấy trang</h1><p>Trang bạn đang tìm không tồn tại.</p><Link to="/">Về trang chủ</Link></section>} />
    </Routes>
  );
}
