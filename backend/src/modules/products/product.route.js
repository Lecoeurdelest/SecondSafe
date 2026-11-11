const express = require('express');
const controller = require('./product.controller');
const adminProductController = require('./admin-product.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireAdmin } = require('../../common/middlewares/admin.middleware');
const { requireSellerCanSell } = require('../../common/middlewares/seller-restriction.middleware');

const router = express.Router();

router.get('/search', controller.search);
router.get('/my-products', authenticate, controller.listMine);
router.get('/admin', authenticate, requireAdmin, adminProductController.listProducts);
router.put('/admin/:id', authenticate, requireAdmin, adminProductController.updateContent);
router.patch('/admin/:id/status', authenticate, requireAdmin, adminProductController.updateVisibility);
router.post('/', authenticate, requireSellerCanSell, controller.create);
router.put('/:id', authenticate, requireSellerCanSell, controller.update);
router.delete('/:id', authenticate, requireSellerCanSell, controller.remove);
router.patch('/:id/visibility', authenticate, requireSellerCanSell, controller.visibility);
router.get('/', controller.list);
router.get('/:id', controller.getById);

module.exports = router;
