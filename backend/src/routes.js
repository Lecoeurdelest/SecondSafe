const express = require('express');
const { availableRouter } = require('./common/middlewares/available-router.middleware');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, service: 'secondsafe-backend' });
});

router.use('/auth', require('./modules/auth/auth.route'));
router.use('/products', require('./modules/products/product.route'));
router.use('/categories', require('./modules/products/category.route'));
router.use('/upload', require('./modules/products/upload.route'));
router.use('/wallets', require('./modules/payments/wallet.route'));
router.use('/payments/sepay', require('./modules/payments/sepay.route'));
router.use('/payments', require('./modules/payments/payment.route'));
// Historical orders routes must stay closed until their security dependencies exist.
router.use('/orders', availableRouter(() => [
  require('./common/middlewares/auth.middleware').authenticate,
  require('./common/middlewares/role.middleware').requireRole,
  require('./common/middlewares/seller-restriction.middleware').requireSellerCanSell
].every(value => typeof value === 'function'), () => require('./modules/orders/order.route')));
router.use('/chat', require('./modules/chat/chat.route'));
router.use('/reviews', require('./modules/reports/review.route'));
router.use('/', require('./modules/reports/report.route'));
router.use('/users', require('./modules/users/user.route'));
router.use('/delivery', require('./modules/delivery/delivery.route'));
router.use('/favorites', require('./modules/users/favorite.route'));
router.use('/moderator', require('./modules/moderator/moderator.route'));
router.use('/notifications', require('./modules/notifications/notification.route'));

module.exports = router;
