const productService = require('./product.service');
const { sendSuccess } = require('../../common/utils/response.util');

async function list(req, res, next) {
  try {
    return sendSuccess(res, 200, await productService.listProducts(req.query));
  } catch (error) {
    return next(error);
  }
}

async function search(req, res, next) {
  try {
    return sendSuccess(res, 200, await productService.listProducts({
      ...req.query,
      search: req.query.q || req.query.search
    }));
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, search };
