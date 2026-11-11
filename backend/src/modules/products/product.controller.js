const productService = require('./product.service');
const managementService = require('./product-management.service');
const { createNotification } = require('../notifications/notification.service');
const logger = require('../../common/utils/logger.util');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

function respondError(res, error, operation) {
  const statusCode = Number(error.statusCode);
  if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500) {
    return sendError(res, statusCode, error.message);
  }
  if (error.name === 'ValidationError') return sendError(res, 400, 'Dữ liệu sản phẩm không hợp lệ');
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
    return sendSuccess(res, 200, await productService.getProductById(req.params.id, req.user?.userId));
  } catch (error) {
    return respondError(res, error, 'Get product by ID failed');
  }
}

async function notifyListingCreated(userId, product) {
  try {
    await createNotification(userId, {
      type: 'system',
      productId: product._id,
      title: 'Đăng tin thành công',
      message: `Tin đăng "${product.title}" đã được đăng thành công.`
    });
  } catch (error) {
    logger.error('Listing notification failed', { error: error.message });
  }
}

async function create(req, res) {
  try {
    const product = await managementService.createProduct(req.user.userId, req.body);
    await notifyListingCreated(req.user.userId, product);
    return sendSuccess(res, 201, product, 'Sản phẩm đã được tạo thành công');
  } catch (error) {
    return respondError(res, error, 'Creating product failed');
  }
}

async function update(req, res) {
  try {
    const product = await managementService.updateProduct(req.params.id, req.user.userId, req.body);
    return sendSuccess(res, 200, product, 'Sản phẩm đã được cập nhật thành công');
  } catch (error) {
    return respondError(res, error, 'Updating product failed');
  }
}

async function remove(req, res) {
  try {
    const product = await managementService.deleteProduct(req.params.id, req.user.userId);
    return sendSuccess(res, 200, product, 'Sản phẩm đã được xóa thành công');
  } catch (error) {
    return respondError(res, error, 'Deleting product failed');
  }
}

async function updateVisibility(req, res) {
  try {
    const product = await managementService.setProductVisibility(req.params.id, req.user.userId, req.body?.status);
    return sendSuccess(res, 200, product, 'Trạng thái hiển thị đã được cập nhật');
  } catch (error) {
    return respondError(res, error, 'Updating product visibility failed');
  }
}

async function listMine(req, res) {
  try {
    const result = await managementService.getMyProducts(req.user.userId, req.query);
    return sendSuccess(res, 200, result, 'Danh sách sản phẩm của bạn');
  } catch (error) {
    return respondError(res, error, 'Listing own products failed');
  }
}

module.exports = { list, search, getById, create, update, remove, updateVisibility, listMine };
