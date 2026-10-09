const crypto = require('node:crypto');
const business = require('../../config/business');
const { createMemoryStore } = require('./expiring-store.util');

const invalid = () => ({ valid: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.' });
const digest = value => crypto.createHash('sha256').update(value).digest();

function codeKey(subject, purpose) {
  if (typeof subject !== 'string' || !subject.trim() || typeof purpose !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(purpose)) {
    throw Object.assign(new Error('Thông tin xác thực không hợp lệ'), { statusCode: 400 });
  }
  return `code:${purpose}:${digest(subject.trim().toLowerCase()).toString('hex')}`;
}

function matchesCode(record, code) {
  if (typeof code !== 'string' || code.length > 128) return false;
  return crypto.timingSafeEqual(digest(`${record.salt}:${code}`), Buffer.from(record.hash, 'hex'));
}

function createCodeManager({ now = Date.now, store = createMemoryStore({ now }) } = {}) {
  async function issue(subject, { purpose = 'register', payload = null, ttlMs = business.otpTtlMs, token = false } = {}) {
    const key = codeKey(subject, purpose);
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new TypeError('Code lifetime must be a positive integer');
    const code = token ? crypto.randomBytes(32).toString('hex') : String(crypto.randomInt(100000, 1000000));
    const salt = crypto.randomBytes(16).toString('hex');
    const record = { hash: digest(`${salt}:${code}`).toString('hex'), salt, payload, attempts: 0, expiresAt: now() + ttlMs };
    return store.update(key, () => ({ record, result: code }));
  }

  async function consume(subject, code, { purpose = 'register' } = {}) {
    return store.update(codeKey(subject, purpose), record => {
      if (!record || record.expiresAt <= now()) return { result: invalid() };
      if (matchesCode(record, code)) return { result: { valid: true, payload: record.payload, userData: record.payload } };
      record.attempts += 1;
      return { record: record.attempts < business.otpMaxAttempts ? record : undefined, result: invalid() };
    });
  }

  async function invalidate(subject, { purpose = 'register' } = {}) {
    return store.update(codeKey(subject, purpose), () => ({}));
  }

  return {
    issue, consume, invalidate,
    generateAndSaveOtp: (email, userData, purpose = 'register') => issue(email, { payload: userData, purpose }),
    verifyOtp: (email, code, purpose = 'register') => consume(email, String(code), { purpose })
  };
}

module.exports = { ...createCodeManager(), createCodeManager };
