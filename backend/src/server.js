require('dotenv').config();

const http = require('http');
const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

connectDB();

http.createServer(app).listen(config.server.port, () => {
  console.log(`SecondSafe backend listening on port ${config.server.port}`);
});
