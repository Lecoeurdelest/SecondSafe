const express = require('express');
const controller = require('./category.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/:slug', controller.getBySlug);

module.exports = router;
