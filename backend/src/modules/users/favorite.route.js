const express = require('express');
const router = express.Router();
const controller = require('./favorite.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

router.use(authenticate);
router.get('/check/:productId', controller.check);
router.get('/', controller.list);
router.post('/', controller.add);
router.delete('/:productId', controller.remove);
module.exports = router;
