const crypto = require('node:crypto');
const { sendError } = require('../utils/response.util');

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function safeEqual(given, wanted) {
  const left = Buffer.from(given);
  const right = Buffer.from(wanted);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// Same contract as Vercel Cron: `Authorization: Bearer <CRON_SECRET>`. Disabled until the secret is configured.
function authenticateCron(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return sendError(res, 503, 'Tác vụ định kỳ chưa được cấu hình');
  if (!safeEqual(bearerToken(req), secret)) return sendError(res, 401, 'Không có quyền chạy tác vụ định kỳ');
  return next();
}

module.exports = { authenticateCron };
