const { sendError } = require('../utils/response.util');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return sendError(res, 401, 'Vui lòng đăng nhập');
    const allowed = roles.includes(req.user.role) || (req.user.role === 'admin' && roles.includes('moderator'));
    if (!allowed) return sendError(res, 403, 'Bạn không có quyền truy cập chức năng này');
    return next();
  };
}

module.exports = { requireRole };
