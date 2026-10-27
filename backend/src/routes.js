/**
 * Central Routes Configuration
 * This file registers all API routes for the application
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./modules/auth/auth.route');
const productRoutes = require('./modules/products/product.route');
const categoryRoutes = require('./modules/products/category.route');
const uploadRoutes = require('./modules/products/upload.route');
const walletRoutes = require('./modules/payments/wallet.route');
const paymentRoutes = require('./modules/payments/payment.route');
const orderRoutes = require('./modules/orders/order.route');
const chatRoutes = require('./modules/chat/chat.route');
const supportRoutes = require('./modules/support/support.route');
const assistantRoutes = require('./modules/assistant/assistant.route');
const reviewRoutes = require('./modules/reports/review.route');
const reportRoutes = require('./modules/reports/report.route');
const userRoutes = require('./modules/users/user.route');
const deliveryRoutes = require('./modules/delivery/delivery.route');
const favoriteRoutes = require('./modules/users/favorite.route');
const cartRoutes = require('./modules/users/cart.route');
const moderatorRoutes = require("./modules/moderator/moderator.route");
const notificationRoutes = require('./modules/notifications/notification.route');
const sepayRoutes = require('./modules/payments/sepay.route');

// Register routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/upload', uploadRoutes);
router.use('/wallets', walletRoutes);
router.use('/payments/sepay', sepayRoutes);
router.use('/payments', paymentRoutes);
router.use('/orders', orderRoutes);
router.use('/chat', chatRoutes);
router.use('/support', supportRoutes);
router.use('/assistant', assistantRoutes);
router.use('/reviews', reviewRoutes);
router.use('/', reportRoutes);
router.use('/users', userRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/cart', cartRoutes);
router.use("/moderator", moderatorRoutes);
router.use('/notifications', notificationRoutes);
// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ReFlow API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      upload: '/api/upload',
      wallets: '/api/wallets',
      payments: '/api/payments',
      orders: '/api/orders',
      cart: '/api/cart',
      favorites: '/api/favorites',
      chat: '/api/chat',
      support: '/api/support',
      assistant: '/api/assistant',
      reviews: '/api/reviews',
      reports: '/api/reports',
      disputes: '/api/disputes',
      users: '/api/users',
      adminDashboard: '/api/users/admin/dashboard',
      moderatorDashboard: '/api/moderator/dashboard',
      delivery: '/api/delivery'
    }
  });
});

module.exports = router;
