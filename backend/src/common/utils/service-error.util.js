const logger = require('./logger.util');
const { sendError } = require('./response.util');

const DATA_ERRORS = { CastError: 'ID không hợp lệ', ValidationError: 'Dữ liệu không hợp lệ' };

// Business rules throw plain errors whose message is safe to show; anything else stays internal.
function sendServiceError(res, error, fallbackStatus = 400) {
  if (DATA_ERRORS[error?.name]) return sendError(res, 400, DATA_ERRORS[error.name]);
  if (error?.name !== 'Error') {
    logger.error('Service request failed', { error: error?.name, message: error?.message });
    return sendError(res, 500, 'Lỗi hệ thống, vui lòng thử lại sau');
  }
  const statusCode = Number(error.statusCode);
  const status = Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500 ? statusCode : fallbackStatus;
  return sendError(res, status, error.message);
}

module.exports = { sendServiceError };
