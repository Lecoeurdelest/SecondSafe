const express = require('express');
const controller = require('./product.controller');

const router = express.Router();

router.get('/search', controller.search);
router.get('/', controller.list);

module.exports = router;
