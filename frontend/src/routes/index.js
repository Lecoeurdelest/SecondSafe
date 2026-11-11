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
const CreateProduct = lazy(() => import('../modules/product/CreateProduct'));
const EditProduct = lazy(() => import('../modules/product/EditProduct'));
const MyProducts = lazy(() => import('../modules/product/MyProducts'));
const Orders = lazy(() => import('../modules/order/Orders'));
const OrderDetail = lazy(() => import('../modules/order/OrderDetail'));
const OrderPayment = lazy(() => import('../modules/order/OrderPayment'));
const SEPayOrderSuccess = lazy(() => import('../modules/order/SEPayOrderSuccess'));
const PurchaseRequests = lazy(() => import('../modules/order/PurchaseRequests'));
const SellerOrders = lazy(() => import('../modules/order/SellerOrders'));
const AbandonedCheckouts = lazy(() => import('../modules/order/AbandonedCheckouts'));
const Wallet = lazy(() => import('../modules/wallet/Wallet'));
const TopUp = lazy(() => import('../modules/wallet/TopUp'));
const TopUpResult = lazy(() => import('../modules/wallet/TopUpResult'));
const VNPaySuccess = lazy(() => import('../modules/wallet/VNPaySuccess'));
const Withdrawal = lazy(() => import('../modules/wallet/Withdrawal'));
const ModReportList = lazy(() => import('../modules/moderator/reports/ModReportList'));
const ModReportDetail = lazy(() => import('../modules/moderator/reports/ModReportDetail'));
const ModOrderList = lazy(() => import('../modules/moderator/orders/ModOrderList'));
const ModOrderDetail = lazy(() => import('../modules/moderator/orders/ModOrderDetail'));
const ModReviewList = lazy(() => import('../modules/moderator/reviews/ModReviewList'));
const ModDisputeList = lazy(() => import('../modules/moderator/disputes/ModDisputeList'));
const ModDisputeDetail = lazy(() => import('../modules/moderator/disputes/ModDisputeDetail'));
const ModWithdrawalList = lazy(() => import('../modules/moderator/withdrawals/ModWithdrawalList'));
const AdminReportList = lazy(() => import('../modules/admin/reports/AdminReportList'));
const AdminReportDetail = lazy(() => import('../modules/admin/reports/AdminReportDetail'));
const AdminOrderList = lazy(() => import('../modules/admin/orders/AdminOrderList'));
const AdminOrderDetail = lazy(() => import('../modules/admin/orders/AdminOrderDetail'));
const AdminReviewList = lazy(() => import('../modules/admin/reviews/AdminReviewList'));
const AdminWithdrawalList = lazy(() => import('../modules/admin/withdrawals/AdminWithdrawalList'));
const AdminDisputeList = lazy(() => import('../modules/admin/disputes/AdminDisputeList'));
const AdminDisputeDetail = lazy(() => import('../modules/admin/disputes/AdminDisputeDetail'));
const AdminRevenueReport = lazy(() => import('../modules/admin/revenue/AdminRevenueReport'));
const AdminProducts = lazy(() => import('../modules/dashboard/AdminProducts'));

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
      <Route path="/product/create" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
      <Route path="/product/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
      <Route path="/cart" element={<><AbandonedCheckouts /><Cart /></>} />
      <Route path="/orders" element={<ProtectedRoute><AbandonedCheckouts /><Orders /></ProtectedRoute>} />
      <Route path="/orders/sepay-success" element={<ProtectedRoute><SEPayOrderSuccess /></ProtectedRoute>} />
      <Route path="/orders/sepay-result" element={<ProtectedRoute><SEPayOrderSuccess /></ProtectedRoute>} />
      <Route path="/orders/:id/pay" element={<ProtectedRoute><OrderPayment /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="/order-detail/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="/purchase-requests" element={<ProtectedRoute><PurchaseRequests /></ProtectedRoute>} />
      <Route path="/seller-orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/wallet/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
      <Route path="/wallet/topup-success" element={<ProtectedRoute><VNPaySuccess /></ProtectedRoute>} />
      <Route path="/wallet/topup-result" element={<ProtectedRoute><TopUpResult /></ProtectedRoute>} />
      <Route path="/wallet/withdraw" element={<ProtectedRoute><Withdrawal /></ProtectedRoute>} />
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
      <Route path="/admin/products" element={<DashboardRoute role="admin"><AdminProducts /></DashboardRoute>} />
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/reports" element={<AdminReportList />} />
        <Route path="/admin/reports/:id" element={<AdminReportDetail />} />
        <Route path="/admin/orders" element={<AdminOrderList />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
        <Route path="/admin/reviews" element={<AdminReviewList />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawalList />} />
        <Route path="/admin/disputes" element={<AdminDisputeList />} />
        <Route path="/admin/disputes/:id" element={<AdminDisputeDetail />} />
        <Route path="/admin/revenue" element={<AdminRevenueReport />} />
      </Route>
      <Route path="/staff" element={<DashboardRoute role="moderator"><Dashboard role="moderator" /></DashboardRoute>} />
      <Route path="/moderator/dashboard" element={<DashboardRoute role="moderator"><Dashboard role="moderator" /></DashboardRoute>} />
      <Route path="/moderator" element={<ModeratorRoute><ModeratorLayout /></ModeratorRoute>}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ModProfile />} />
        <Route path="reports" element={<ModReportList />} />
        <Route path="reports/:id" element={<ModReportDetail />} />
        <Route path="orders" element={<ModOrderList />} />
        <Route path="orders/:id" element={<ModOrderDetail />} />
        <Route path="reviews" element={<ModReviewList />} />
        <Route path="disputes" element={<ModDisputeList />} />
        <Route path="disputes/:id" element={<ModDisputeDetail />} />
        <Route path="withdrawals" element={<ModWithdrawalList />} />
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
