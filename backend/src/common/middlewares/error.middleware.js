const { sendError } = require('../utils/response.util');
const logger = require('../utils/logger.util');

const ERROR_TYPES = {
  'entity.too.large': [413, 'Dữ liệu yêu cầu vượt quá giới hạn 1 MB'],
  'entity.parse.failed': [400, 'Dữ liệu JSON không hợp lệ'],
  'encoding.unsupported': [415, 'Định dạng mã hóa không được hỗ trợ'],
  ValidationError: [400, 'Dữ liệu không hợp lệ'],
  CastError: [400, 'ID không hợp lệ'],
  JsonWebTokenError: [401, 'Token không hợp lệ'],
  TokenExpiredError: [401, 'Token đã hết hạn']
};

function errorResponse(error) {
  if (ERROR_TYPES[error.type]) return ERROR_TYPES[error.type];
  if (ERROR_TYPES[error.name]) return ERROR_TYPES[error.name];
  if (error.code === 11000) return [409, 'Dữ liệu đã tồn tại'];
  const status = Number(error.statusCode || error.status);
  if (Number.isInteger(status) && status >= 400 && status < 500) return [status, error.message];
  if (Number.isInteger(status) && status >= 500 && status <= 599 && error.expose === true) return [status, error.message];
  return [500, 'Lỗi hệ thống, vui lòng thử lại sau'];
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const [status, message] = errorResponse(error);
  logger.error('HTTP request failed', { status, method: req.method, path: req.path, error: error.name });
  return sendError(res, status, message);
}

function notFoundHandler(req, res) {
  return sendError(res, 404, 'Không tìm thấy tài nguyên');
}

module.exports = { errorHandler, notFoundHandler };
