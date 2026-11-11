const express = require('express');
const controller = require('./abandoned-checkout.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/role.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/summary', requireRole('moderator'), controller.getSummary);
router.get('/all', requireRole('moderator'), controller.listAll);
router.get('/', controller.listMine);
router.post('/:id/dismiss', controller.dismiss);

module.exports = router;
