const { sendError } = require('../utils/response.util');

function requireSellerCanSell(req, res, next) {
  return sendError(res, 503, 'Chức năng đang được hoàn thiện, vui lòng thử lại sau');
}

module.exports = { requireSellerCanSell };
