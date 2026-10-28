const User = require('../../modules/users/user.model');
const { sendError } = require('../utils/response.util');
const { refreshSellingRestriction, getSellingRestrictionMessage } = require('../utils/seller-restriction.util');

async function requireSellerCanSell(req, res, next) {
  try {
    if (!req.user?.userId) return sendError(res, 401, 'Vui lòng đăng nhập');
    const user = await User.findById(req.user.userId);
    if (!user) return sendError(res, 401, 'Thông tin xác thực không hợp lệ');
    const restricted = await refreshSellingRestriction(user);
    if (restricted) return sendError(res, 403, getSellingRestrictionMessage(user));
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireSellerCanSell };
