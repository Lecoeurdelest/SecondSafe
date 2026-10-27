const jwt = require('jsonwebtoken');
const business = require('../../config/business');

function invalidToken(message = 'Token không hợp lệ') {
  return Object.assign(new Error(message), { statusCode: 401 });
}

function signingSecret() {
  if (!process.env.JWT_SECRET) throw new Error('Missing JWT_SECRET');
  return process.env.JWT_SECRET;
}

function validUserId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''));
}

function validClaims(decoded) {
  return Boolean(decoded) && typeof decoded === 'object' && typeof decoded.userId === 'string'
    && validUserId(decoded.userId) && Number.isSafeInteger(decoded.exp);
}

function generateJWT(payload, expiresIn = business.jwtTtlSeconds) {
  if (!payload || !validUserId(payload.userId)) throw new Error('JWT payload must contain a valid userId');
  return jwt.sign({ userId: String(payload.userId) }, signingSecret(), { algorithm: 'HS256', expiresIn });
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.trim()) throw invalidToken();
  const secret = signingSecret();
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (!validClaims(decoded)) throw invalidToken();
    return decoded;
  } catch (error) {
    throw invalidToken(error.name === 'TokenExpiredError' ? 'Token đã hết hạn' : 'Token không hợp lệ');
  }
}

module.exports = { generateJWT, verifyToken };
