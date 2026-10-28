const mongoose = require('mongoose');
const Category = require('./category.model');
const Product = require('./product.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const { getEligibleSellerIds } = require('./product-availability.service');
const { pagination } = require('../../common/utils/pagination.util');
const { refreshSellingRestriction, getSellingRestrictionMessage } = require('../../common/utils/seller-restriction.util');

const CONDITIONS = new Set(['new', 'like-new', 'good', 'fair', 'poor']);
const SORTS = {
  createdAt: { createdAt: -1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  name_asc: { title: 1 },
  name_desc: { title: -1 }
};

function parsePrice(value, name) {
  if (value === undefined || value === '') return undefined;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw Object.assign(new Error(`Giá ${name} không hợp lệ`), { statusCode: 400 });
  }
  return price;
}

function parseCities(query) {
  const values = [query.city, query.cities, query['cities[]']]
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(value => typeof value === 'string')
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

async function categoryFilter(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const category = mongoose.Types.ObjectId.isValid(value)
    ? { _id: value }
    : await Category.findOne({ slug: value.trim().toLowerCase(), isActive: true }).select('_id').lean();
  const id = category && (category._id || category);
  return id ? { $or: [{ category: id }, { categories: id }] } : { $or: [] };
}

async function listProducts(query = {}) {
  const { page, limit, skip } = pagination(query);
  const minPrice = parsePrice(query.minPrice, 'tối thiểu');
  const maxPrice = parsePrice(query.maxPrice, 'tối đa');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw Object.assign(new Error('Khoảng giá không hợp lệ'), { statusCode: 400 });
  }
  if (query.condition && !CONDITIONS.has(query.condition)) {
    throw Object.assign(new Error('Tình trạng sản phẩm không hợp lệ'), { statusCode: 400 });
  }

  const productFilter = { status: 'active' };
  const cities = parseCities(query);
  if (cities.length) productFilter['location.city'] = { $in: cities };
  if (query.condition) productFilter.condition = query.condition;
  if (minPrice !== undefined || maxPrice !== undefined) {
    productFilter.price = {};
    if (minPrice !== undefined) productFilter.price.$gte = minPrice;
    if (maxPrice !== undefined) productFilter.price.$lte = maxPrice;
  }

  const category = await categoryFilter(query.category);
  if (category) {
    if (!category.$or.length) return { products: [], total: 0, page, totalPages: 0, limit };
    productFilter.$and = [category];
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) productFilter.$text = { $search: search };

  const sellerIds = await getEligibleSellerIds();
  if (!sellerIds.length) return { products: [], total: 0, page, totalPages: 0, limit };
  productFilter.seller = { $in: sellerIds };

  const sort = search
    ? { score: { $meta: 'textScore' }, createdAt: -1 }
    : SORTS[query.sort] || SORTS.createdAt;
  let productQuery = Product.find(productFilter);
  if (search) productQuery = productQuery.select({ score: { $meta: 'textScore' } });
  const [products, total] = await Promise.all([
    productQuery.populate('category', 'name slug')
      .populate('seller', 'fullName avatar rating')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(productFilter)
  ]);

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit
  };
}

async function getProductById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm'), { statusCode: 404 });
  }

  const sellerIds = await getEligibleSellerIds();
  if (!sellerIds.length) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm'), { statusCode: 404 });
  }

  const product = await Product.findOne({
    _id: id,
    status: 'active',
    seller: { $in: sellerIds }
  })
    .populate('category', 'name slug')
    .populate('seller', 'fullName avatar rating')
    .lean();

  if (!product) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm'), { statusCode: 404 });
  }
  return product;
}

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

async function requireActiveSeller(sellerId) {
  const seller = await User.findById(sellerId);
  if (!seller) throw httpError(401, 'Thông tin xác thực không hợp lệ');
  if (await refreshSellingRestriction(seller)) throw httpError(403, getSellingRestrictionMessage(seller));
  return seller;
}

async function assertMutableProduct(product, sellerId) {
  if (!product || String(product.seller) !== String(sellerId)) throw httpError(404, 'Không tìm thấy tin đăng của bạn');
  if (['sold', 'deleted', 'expired'].includes(product.status)) throw httpError(409, 'Tin đăng đã kết thúc không thể chỉnh sửa');
  const activeOrder = await Order.exists({ productId: product._id, status: { $nin: ['cancelled', 'completed'] } });
  if (activeOrder) throw httpError(409, 'Tin đăng đang có giao dịch không thể chỉnh sửa');
}

function validateListingPayload(payload) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const price = Number(payload.price);
  const condition = payload.condition;
  const category = payload.category;
  const city = typeof payload.location?.city === 'string' ? payload.location.city.trim() : '';
  const district = typeof payload.location?.district === 'string' ? payload.location.district.trim() : '';
  const images = Array.isArray(payload.images) ? payload.images.filter(value => typeof value === 'string' && value.trim()) : [];
  const otherCategory = typeof payload.otherCategory === 'string' ? payload.otherCategory.trim() : '';

  if (!title || title.length > 200) throw httpError(400, 'Tên sản phẩm là bắt buộc và không quá 200 ký tự');
  if (!description || description.length > 2000) throw httpError(400, 'Mô tả là bắt buộc và không quá 2000 ký tự');
  if (!Number.isInteger(price) || price < 0) throw httpError(400, 'Giá phải là số nguyên VND không âm');
  if (!CONDITIONS.has(condition)) throw httpError(400, 'Tình trạng sản phẩm không hợp lệ');
  if (!mongoose.Types.ObjectId.isValid(category)) throw httpError(400, 'Danh mục sản phẩm không hợp lệ');
  if (!images.length || images.length > 6 || images.some(image => !/^\/uploads\/products\/[a-zA-Z0-9]+\/.+/.test(image))) {
    throw httpError(400, 'Vui lòng chọn từ 1 đến 6 ảnh sản phẩm hợp lệ');
  }
  if (!city || !district) throw httpError(400, 'Vui lòng nhập đầy đủ tỉnh/thành phố và quận/huyện');
  if (otherCategory.length > 100) throw httpError(400, 'Tên danh mục khác không quá 100 ký tự');
  return { title, description, price, condition, category, images, otherCategory, location: { city, district } };
}

async function createProduct(sellerId, payload) {
  await requireActiveSeller(sellerId);
  const data = validateListingPayload(payload);
  const category = await Category.findOne({ _id: data.category, isActive: true }).select('_id');
  if (!category) throw httpError(400, 'Danh mục sản phẩm không hợp lệ');
  return Product.create({ ...data, category: category._id, categories: payload.categories || [], seller: sellerId, status: 'active', moderationStatus: 'approved' });
}

async function getMyProducts(sellerId, query = {}) {
  const { page, limit, skip } = pagination(query);
  const filter = { seller: sellerId, status: { $ne: 'deleted' } };
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter)
  ]);
  return { products, total, page, totalPages: Math.ceil(total / limit), limit };
}

async function updateProduct(id, sellerId, payload) {
  await requireActiveSeller(sellerId);
  const product = await Product.findById(id);
  await assertMutableProduct(product, sellerId);
  const data = validateListingPayload(payload);
  const category = await Category.findOne({ _id: data.category, isActive: true }).select('_id');
  if (!category) throw httpError(400, 'Danh mục sản phẩm không hợp lệ');
  Object.assign(product, data, { category: category._id, updatedAt: new Date() });
  await product.save();
  return product;
}

async function deleteProduct(id, sellerId) {
  await requireActiveSeller(sellerId);
  const product = await Product.findById(id);
  await assertMutableProduct(product, sellerId);
  product.status = 'deleted';
  await product.save();
  return product;
}

async function updateProductVisibility(id, sellerId, status) {
  await requireActiveSeller(sellerId);
  const product = await Product.findById(id);
  await assertMutableProduct(product, sellerId);
  if (!['active', 'hidden'].includes(status)) throw httpError(400, 'Trạng thái hiển thị không hợp lệ');
  product.status = status;
  await product.save();
  return product;
}

module.exports = { listProducts, getProductById, createProduct, getMyProducts, updateProduct, deleteProduct, updateProductVisibility };
