const cartService = require('./cart.service');
const logger = require('../../common/utils/logger.util');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

function respondError(res, error, operation) {
  const statusCode = Number(error.statusCode);
  if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500) {
    return sendError(res, statusCode, error.message);
  }
  logger.error(operation, { error: error.message });
  return sendError(res, 500, 'Lỗi hệ thống, vui lòng thử lại sau');
}

async function add(req, res) {
  try {
    const item = await cartService.add(req.user.userId, req.body.productId);
    return sendSuccess(res, 201, item, 'Đã thêm sản phẩm vào giỏ hàng');
  } catch (error) {
    return respondError(res, error, 'Adding product to cart failed');
  }
}

async function remove(req, res) {
  try {
    const result = await cartService.remove(req.user.userId, req.params.productId);
    return sendSuccess(res, 200, result, 'Đã xóa sản phẩm khỏi giỏ hàng');
  } catch (error) {
    return respondError(res, error, 'Removing product from cart failed');
  }
}

async function list(req, res) {
  try {
    const result = await cartService.list(req.user.userId, req.query);
    return sendSuccess(res, 200, result);
  } catch (error) {
    return respondError(res, error, 'Listing cart failed');
  }
}

module.exports = { add, remove, list };
