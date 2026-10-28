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

async function create(req, res) {
  try {
    return sendSuccess(res, 201, await productService.createProduct(req.user.userId, req.body), 'Đăng bán sản phẩm thành công');
  } catch (error) {
    return respondError(res, error, 'Create product failed');
  }
}

async function listMine(req, res) {
  try {
    return sendSuccess(res, 200, await productService.getMyProducts(req.user.userId, req.query));
  } catch (error) {
    return respondError(res, error, 'List seller products failed');
  }
}

async function update(req, res) {
  try {
    return sendSuccess(res, 200, await productService.updateProduct(req.params.id, req.user.userId, req.body), 'Cập nhật tin đăng thành công');
  } catch (error) {
    return respondError(res, error, 'Update product failed');
  }
}

async function remove(req, res) {
  try {
    return sendSuccess(res, 200, await productService.deleteProduct(req.params.id, req.user.userId), 'Xóa tin đăng thành công');
  } catch (error) {
    return respondError(res, error, 'Delete product failed');
  }
}

async function visibility(req, res) {
  try {
    return sendSuccess(res, 200, await productService.updateProductVisibility(req.params.id, req.user.userId, req.body.status));
  } catch (error) {
    return respondError(res, error, 'Update product visibility failed');
  }
}

module.exports = { list, search, getById, create, listMine, update, remove, visibility };
