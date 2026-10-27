const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./common/middlewares/error.middleware');

const app = express();

const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === frontendOrigin) return callback(null, true);
    const error = new Error('Nguồn truy cập không được phép');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
