const categoryService = require('./category.service');
const { sendSuccess } = require('../../common/utils/response.util');

async function list(req, res, next) {
  try {
    return sendSuccess(res, 200, await categoryService.listCategories());
  } catch (error) {
    return next(error);
  }
}

async function getBySlug(req, res, next) {
  try {
    return sendSuccess(res, 200, await categoryService.getCategoryBySlug(req.params.slug));
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, getBySlug };
