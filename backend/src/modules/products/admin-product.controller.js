const adminProductService = require('./admin-product.service');
const { sendSuccess } = require('../../common/utils/response.util');

async function listProducts(req, res, next) {
  try {
    return sendSuccess(res, 200, await adminProductService.listProducts(req.query));
  } catch (error) {
    return next(error);
  }
}

async function updateVisibility(req, res, next) {
  try {
    const product = await adminProductService.updateVisibility(req.params.id, req.body?.status);
    return sendSuccess(res, 200, product, 'Đã cập nhật trạng thái sản phẩm.');
  } catch (error) {
    return next(error);
  }
}

async function updateContent(req, res, next) {
  try {
    const product = await adminProductService.updateContent(req.params.id, req.body);
    return sendSuccess(res, 200, product, 'Đã cập nhật thông tin sản phẩm.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { listProducts, updateVisibility, updateContent };
