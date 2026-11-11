const mongoose = require('mongoose');
const Product = require('./product.model');
const { pagination } = require('../../common/utils/pagination.util');

const ADMIN_PRODUCT_STATUSES = new Set([
  'pending',
  'active',
  'sold',
  'rejected',
  'expired',
  'hidden',
  'deleted'
]);

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function buildFilter(query) {
  const filter = {};
  const status = typeof query.status === 'string' ? query.status : '';
  if (status && status !== 'all') {
    if (!ADMIN_PRODUCT_STATUSES.has(status)) throw httpError(400, 'Trạng thái sản phẩm không hợp lệ.');
    filter.status = status;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search.length > 100) throw httpError(400, 'Từ khóa tìm kiếm không quá 100 ký tự.');
  if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  return filter;
}

async function listProducts(query = {}) {
  const { page, limit, skip } = pagination({ ...query, limit: query.limit || 20 });
  const filter = buildFilter(query);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('seller', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);
  return { products, total, page, totalPages: Math.ceil(total / limit), limit };
}

async function updateVisibility(productId, status) {
  if (!mongoose.Types.ObjectId.isValid(String(productId || ''))) {
    throw httpError(400, 'Mã sản phẩm không hợp lệ.');
  }
  if (!['active', 'hidden'].includes(status)) {
    throw httpError(400, 'Admin chỉ có thể ẩn tin đang bán hoặc khôi phục tin đã ẩn.');
  }

  const product = await Product.findById(productId);
  if (!product) throw httpError(404, 'Không tìm thấy sản phẩm.');
  if (status === 'hidden' && product.status !== 'active') {
    throw httpError(409, 'Chỉ có thể ẩn sản phẩm đang bán.');
  }
  if (status === 'active' && product.status !== 'hidden') {
    throw httpError(409, 'Chỉ có thể khôi phục sản phẩm đang ẩn.');
  }

  product.status = status;
  await product.save();
  return product;
}

module.exports = { listProducts, updateVisibility };
