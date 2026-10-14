require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./common/utils/logger.util');
const { initializeChatSocket } = require('./modules/chat/chat.socket');

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }
});
initializeChatSocket(io);

server.listen(config.server.port, () => {
  logger.info(`SecondSafe backend listening on port ${config.server.port}`);
});
