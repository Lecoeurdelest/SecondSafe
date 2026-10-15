const logger = require('../common/utils/logger.util');
require('dotenv').config();
const business = require('./business');

const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: business.jwtTtlSeconds,
  },
  chat: {
    // Khoa rieng bat buoc cho chat (NFR-SEC-07): khong dung chung JWT_SECRET.
    encryptionKey: process.env.CHAT_ENCRYPTION_KEY,
  },
  server: {
    port: process.env.PORT || 5000,
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
  },
};

// Kiem tra cac bien moi truong bat buoc
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

module.exports = config;
