require('dotenv').config();

const http = require('http');
const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./common/utils/logger.util');

connectDB();

http.createServer(app).listen(config.server.port, () => {
  logger.info(`SecondSafe backend listening on port ${config.server.port}`);
});
