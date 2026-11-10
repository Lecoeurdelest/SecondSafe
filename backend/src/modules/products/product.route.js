const express = require('express');
const controller = require('./product.controller');
const { authenticate, optionalAuthenticate } = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.get('/search', controller.search);
router.get('/my-products', authenticate, controller.listMine);
router.get('/', controller.list);
router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);
router.patch('/:id/visibility', authenticate, controller.updateVisibility);
router.get('/:id', optionalAuthenticate, controller.getById);

module.exports = router;
