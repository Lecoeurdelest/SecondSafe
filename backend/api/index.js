// Vercel serverless entry: wraps the Express app and reuses one MongoDB connection per warm instance.
// server.js (HTTP server, Socket.IO, cron) is not used on Vercel.
const mongoose = require('mongoose');
const app = require('../src/app');

let connecting;

function connect() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000, bufferCommands: false })
      .catch((error) => {
        connecting = undefined;
        throw error;
      });
  }
  return connecting;
}

module.exports = async (req, res) => {
  try {
    await connect();
  } catch (error) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, message: 'Database unavailable' }));
  }
  return app(req, res);
};
