const productService = require('./product.service');
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

async function list(req, res) {
  try {
    return sendSuccess(res, 200, await productService.listProducts(req.query));
  } catch (error) {
    return respondError(res, error, 'Listing products failed');
  }
}

async function search(req, res) {
  try {
    return sendSuccess(res, 200, await productService.listProducts({
      ...req.query,
      search: req.query.q || req.query.search
    }));
  } catch (error) {
    return respondError(res, error, 'Searching products failed');
  }
}

async function getById(req, res) {
  try {
    return sendSuccess(res, 200, await productService.getProductById(req.params.id));
  } catch (error) {
    return respondError(res, error, 'Get product by ID failed');
  }
}

module.exports = { list, search, getById };
