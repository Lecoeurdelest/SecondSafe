const mongoose = require('mongoose');
const Category = require('./category.model');
const Product = require('./product.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const { pagination } = require('../../common/utils/pagination.util');
const { refreshSellingRestriction, getSellingRestrictionMessage } = require('../../common/utils/seller-restriction.util');

const ACTIVE_ORDER_STATUSES = ['awaiting_seller_confirmation', 'awaiting_payment', 'paid', 'shipped', 'disputed'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];
const EDITABLE_FIELDS = ['title', 'description', 'price', 'condition', 'images', 'location', 'category', 'categories', 'otherCategory'];
const READ_ONLY_STATUS = { sold: 'Sản phẩm đã bán, chỉ có thể xem', pending: 'Sản phẩm đang trong giao dịch, chỉ có thể xem' };
const MAX_IMAGES = 10;
const FALLBACK_CATEGORY = { name: 'Khác', slug: 'other', description: 'Danh mục mặc định cho sản phẩm tự khai báo', icon: '🧩', isActive: true };

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateTitle(value) {
  const title = text(value);
  if (!title || title.length > 200) throw httpError(400, 'Tiêu đề phải có từ 1 đến 200 ký tự');
  return title;
}

function validateDescription(value) {
  const description = text(value);
  if (!description || description.length > 2000) throw httpError(400, 'Mô tả phải có từ 1 đến 2000 ký tự');
  return description;
}

// INV-08: listing prices are integer VND.
function validatePrice(value) {
  const price = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value;
  if (!Number.isSafeInteger(price) || price < 0) throw httpError(400, 'Giá bán phải là số nguyên không âm (VND)');
  return price;
}

function validateOtherCategory(value) {
  const label = text(value);
  if (label.length > 100) throw httpError(400, 'Danh mục khác không được vượt quá 100 ký tự');
  return label;
}

function validateCondition(value) {
  if (!CONDITIONS.includes(value)) throw httpError(400, 'Tình trạng sản phẩm không hợp lệ');
  return value;
}

function validateImages(value) {
  const images = Array.isArray(value) ? value.map(text).filter(Boolean) : [];
  if (!images.length) throw httpError(400, 'Vui lòng tải lên ít nhất 1 ảnh');
  if (images.length > MAX_IMAGES) throw httpError(400, `Chỉ được đăng tối đa ${MAX_IMAGES} ảnh`);
  return images;
}

function validateLocation(value) {
  const location = { city: text(value?.city), district: text(value?.district) };
  if (!location.city || !location.district) {
    throw httpError(400, 'Vui lòng nhập đầy đủ địa chỉ (tỉnh/thành phố và quận/huyện)');
  }
  return location;
}

const VALIDATORS = {
  title: validateTitle,
  description: validateDescription,
  price: validatePrice,
  condition: validateCondition,
  images: validateImages,
  location: validateLocation,
  otherCategory: validateOtherCategory
};

// Clients send categories as an array, a JSON string, a comma list or a single value.
function categoryInputs(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  const raw = text(value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // Not JSON: fall through to the comma-separated form.
  }
  return raw.split(',');
}

async function resolveCategoryId(value) {
  const key = text(String(value ?? ''));
  if (!key) return null;
  const filter = mongoose.Types.ObjectId.isValid(key) ? { _id: key } : { slug: key.toLowerCase() };
  const category = await Category.findOne(filter).select('_id').lean();
  if (!category) throw httpError(400, 'Danh mục không hợp lệ');
  return String(category._id);
}

async function fallbackCategoryId() {
  const existing = await Category.findOne({ slug: { $in: ['other', 'khac'] } }).select('_id').lean();
  if (existing) return String(existing._id);
  const created = await Category.findOneAndUpdate(
    { slug: FALLBACK_CATEGORY.slug },
    { $setOnInsert: FALLBACK_CATEGORY },
    { upsert: true, new: true }
  ).select('_id').lean();
  return String(created._id);
}

async function resolveCategories(data) {
  const ids = [];
  for (const value of [...categoryInputs(data.categories), ...categoryInputs(data.categoryIds)]) {
    const id = await resolveCategoryId(value);
    if (id && !ids.includes(id)) ids.push(id);
  }
  const primary = await resolveCategoryId(data.category || data.categoryId) || ids[0] || null;
  if (primary && !ids.includes(primary)) ids.unshift(primary);
  return { primary, ids };
}

function hasCategoryInput(data) {
  return ['category', 'categoryId', 'categories', 'categoryIds'].some(field => data[field] !== undefined);
}

async function requireSeller(userId) {
  const seller = await User.findById(userId);
  if (!seller) throw httpError(404, 'Người bán không tồn tại');
  if (await refreshSellingRestriction(seller)) throw httpError(403, getSellingRestrictionMessage(seller));
  return seller;
}

async function populated(product) {
  await product.populate([
    { path: 'seller', select: 'fullName' },
    { path: 'category', select: 'name slug' },
    { path: 'categories', select: 'name slug' }
  ]);
  return product;
}

// INV-02: a listing that is sold, reserved or tied to an open order is read-only.
async function requireEditableListing(productId, userId, deniedMessage) {
  if (!mongoose.Types.ObjectId.isValid(productId)) throw httpError(404, 'Sản phẩm không tồn tại');
  const product = await Product.findById(productId);
  if (!product || product.status === 'deleted') throw httpError(404, 'Sản phẩm không tồn tại');
  if (String(product.seller) !== String(userId)) throw httpError(403, deniedMessage);
  if (READ_ONLY_STATUS[product.status]) throw httpError(403, READ_ONLY_STATUS[product.status]);
  if (await Order.exists({ productId: product._id, status: { $in: ACTIVE_ORDER_STATUSES } })) {
    throw httpError(403, 'Sản phẩm đang trong đơn hàng, chỉ có thể xem');
  }
  return product;
}

async function createProduct(userId, data = {}) {
  await requireSeller(userId);
  const fields = {};
  for (const field of ['title', 'description', 'price', 'condition', 'images', 'location', 'otherCategory']) {
    fields[field] = VALIDATORS[field](data[field]);
  }

  const { primary, ids } = await resolveCategories(data);
  const category = primary || (fields.otherCategory ? await fallbackCategoryId() : null);
  if (!category) throw httpError(400, 'Vui lòng chọn danh mục');

  const product = new Product({
    ...fields,
    category,
    categories: ids.includes(category) ? ids : [category, ...ids],
    seller: userId,
    status: 'active',
    moderationStatus: 'approved'
  });
  await product.save();
  return populated(product);
}

async function updateProduct(productId, userId, data = {}) {
  const product = await requireEditableListing(productId, userId, 'Bạn không có quyền chỉnh sửa sản phẩm này');
  const changes = {};
  for (const field of EDITABLE_FIELDS.filter(name => VALIDATORS[name] && data[name] !== undefined)) {
    changes[field] = VALIDATORS[field](data[field]);
  }
  if (hasCategoryInput(data)) {
    const { primary, ids } = await resolveCategories(data);
    if (primary) changes.category = primary;
    changes.categories = ids;
  }
  product.set(changes);
  await product.save();
  return populated(product);
}

async function deleteProduct(productId, userId) {
  const product = await requireEditableListing(productId, userId, 'Bạn không có quyền xóa sản phẩm này');
  product.status = 'deleted';
  await product.save();
  return product;
}

async function setProductVisibility(productId, userId, status) {
  if (!['active', 'hidden'].includes(status)) throw httpError(400, 'Trạng thái hiển thị không hợp lệ');
  const product = await requireEditableListing(productId, userId, 'Bạn không có quyền cập nhật trạng thái sản phẩm này');
  if (status === 'active') await requireSeller(userId);
  product.status = status;
  await product.save();
  return populated(product);
}

async function activeOrderCounts(productIds) {
  if (!productIds.length) return {};
  const rows = await Order.aggregate([
    { $match: { productId: { $in: productIds }, status: { $in: ACTIVE_ORDER_STATUSES } } },
    { $group: { _id: '$productId', count: { $sum: 1 } } }
  ]);
  return Object.fromEntries(rows.map(row => [String(row._id), row.count]));
}

async function getMyProducts(userId, query = {}) {
  const { page, limit, skip } = pagination(query);
  const filter = { seller: userId, status: text(query.status) || { $ne: 'deleted' } };
  if (text(query.moderationStatus)) filter.moderationStatus = text(query.moderationStatus);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);
  const counts = await activeOrderCounts(products.map(product => product._id));
  return {
    products: products.map(product => {
      const activeOrderCount = counts[String(product._id)] || 0;
      return { ...product, activeOrderCount, isInActiveOrder: activeOrderCount > 0 };
    }),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit
  };
}

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  setProductVisibility,
  getMyProducts,
  ACTIVE_ORDER_STATUSES
};
