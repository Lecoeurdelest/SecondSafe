const favoriteService = require('./favorite.service');
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
    const favorite = await favoriteService.add(req.user.userId, req.body.productId);
    return sendSuccess(res, 201, favorite, 'Đã thêm sản phẩm vào danh sách yêu thích');
  } catch (error) {
    return respondError(res, error, 'Adding product favorite failed');
  }
}

async function remove(req, res) {
  try {
    const result = await favoriteService.remove(req.user.userId, req.params.productId);
    return sendSuccess(res, 200, result, 'Đã xóa sản phẩm khỏi danh sách yêu thích');
  } catch (error) {
    return respondError(res, error, 'Removing product favorite failed');
  }
}

async function check(req, res) {
  try {
    const result = await favoriteService.check(req.user.userId, req.params.productId);
    return sendSuccess(res, 200, result);
  } catch (error) {
    return respondError(res, error, 'Checking product favorite failed');
  }
}

async function list(req, res) {
  try {
    const result = await favoriteService.list(req.user.userId, req.query);
    return sendSuccess(res, 200, result);
  } catch (error) {
    return respondError(res, error, 'Listing product favorites failed');
  }
}

module.exports = { add, remove, check, list };
