const express = require('express');
const { authenticateCron } = require('../../common/middlewares/cron-auth.middleware');
const cronController = require('./cron.controller');

const router = express.Router();

// Entry points for an external scheduler, because the Vercel deployment does not run src/server.js.
router.get('/:job', authenticateCron, cronController.runJob);
router.post('/:job', authenticateCron, cronController.runJob);

module.exports = router;
