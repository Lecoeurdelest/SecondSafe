const Category = require('./category.model');

async function listCategories() {
  return Category.find({ isActive: true }).select('name slug description icon').sort({ name: 1 }).lean();
}

async function getCategoryBySlug(slug) {
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) throw Object.assign(new Error('Danh mục không tồn tại'), { statusCode: 404 });
  return category;
}

module.exports = { listCategories, getCategoryBySlug };
