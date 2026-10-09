const { verifyToken } = require('../utils/jwt.util');
const User = require('../../modules/users/user.model');

const AUTH_FIELDS = '_id email fullName role isSuspended suspendedUntil suspendedReason isSellingRestricted sellingRestrictedUntil sellingRestrictedReason sellingRestrictionSource';

async function requestUser(req) {
  const header = req.headers.authorization;
  const bearer = typeof header === 'string' && /^Bearer\s+(\S+)$/i.exec(header);
  if (!bearer) throw Object.assign(new Error('Vui lòng đăng nhập'), { statusCode: 401 });
  const decoded = verifyToken(bearer[1]);
  const user = await User.findById(decoded.userId).select(AUTH_FIELDS).lean();
  if (!user || !['user', 'moderator', 'admin'].includes(user.role)) {
    throw Object.assign(new Error('Thông tin xác thực không hợp lệ'), { statusCode: 401 });
  }
  return {
    userId: user._id, email: user.email, fullName: user.fullName, role: user.role,
    isSellingRestricted: Boolean(user.isSellingRestricted), sellingRestrictedUntil: user.sellingRestrictedUntil || null
  };
}

async function authenticate(req, res, next) {
  try {
    req.user = await requestUser(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

async function optionalAuthenticate(req, res, next) {
  delete req.user;
  if (!req.headers.authorization) return next();
  try {
    req.user = await requestUser(req);
    return next();
  } catch (error) {
    return error.statusCode === 401 ? next() : next(error);
  }
}

module.exports = { authenticate, optionalAuthenticate };
