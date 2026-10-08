const crypto = require('node:crypto');
const business = require('../../config/business');
const { sendError } = require('../utils/response.util');
const { createMemoryCounterStore } = require('../utils/rate-limit-store.util');

const defaultStore = createMemoryCounterStore();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

function requestKeys(req, scope) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const keys = [`rate:${scope}:ip:${hash(ip)}`];
  const email = req.body?.email;
  if (typeof email === 'string' && email.trim() && email.length <= 320) {
    keys.push(`rate:${scope}:email:${hash(email.trim().toLowerCase())}`);
  }
  return keys;
}

function createAuthRateLimit({ scope, store = defaultStore, now = Date.now, limit = business.authRateLimit.requests, windowMs = business.authRateLimit.windowMs } = {}) {
  if (typeof scope !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(scope)) throw new TypeError('A valid rate-limit scope is required');
  if (!Number.isSafeInteger(limit) || limit <= 0) throw new TypeError('Rate limit must be positive');
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) throw new TypeError('Rate-limit window must be positive');

  return async function authRateLimit(req, res, next) {
    try {
      const counters = await Promise.all(requestKeys(req, scope).map(key => store.increment(key, windowMs)));
      const exceeded = counters.filter(counter => counter.count > limit);
      if (!exceeded.length) return next();
      const retrySeconds = Math.max(1, Math.ceil((Math.max(...exceeded.map(counter => counter.resetAt)) - now()) / 1000));
      res.set('Retry-After', String(retrySeconds));
      return sendError(res, 429, 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  createAuthRateLimit,
  loginLimiter: createAuthRateLimit({ scope: 'login' }),
  codeRequestLimiter: createAuthRateLimit({ scope: 'code-request' }),
  codeVerificationLimiter: createAuthRateLimit({ scope: 'code-verification' }),
  recoveryLimiter: createAuthRateLimit({ scope: 'recovery' })
};
