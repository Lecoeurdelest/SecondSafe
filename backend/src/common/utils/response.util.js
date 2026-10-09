const { pagination } = require('./pagination.util');

function sendSuccess(res, statusCode = 200, data = null, message = null) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
}

function sendError(res, statusCode = 500, message = 'Đã xảy ra lỗi', errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

function sendPaginated(res, data, page, limit, total) {
  const bounded = pagination({ page, limit });
  return res.status(200).json({
    success: true,
    data,
    pagination: { page: bounded.page, limit: bounded.limit, total, totalPages: Math.ceil(total / bounded.limit) }
  });
}

module.exports = { sendSuccess, sendError, sendPaginated };
