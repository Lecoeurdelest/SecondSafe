const mongoose = require('mongoose');
const CartItem = require('./cart-item.model');
const Product = require('../products/product.model');
const { getEligibleProductIds } = require('../products/product-availability.service');
const { pagination } = require('../../common/utils/pagination.util');

function invalidProductId() {
  return Object.assign(new Error('ID sản phẩm không hợp lệ'), { statusCode: 400 });
}

async function add(userId, productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) throw invalidProductId();

  const productIds = await getEligibleProductIds(productId);
  if (!productIds.length) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm đang được bán'), { statusCode: 404 });
  }

  const product = await Product.findById(productId).select('seller').lean();
  if (!product) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm đang được bán'), { statusCode: 404 });
  }
  if (String(product.seller) === String(userId)) {
    throw Object.assign(new Error('Bạn không thể thêm sản phẩm của chính mình vào giỏ hàng'), { statusCode: 400 });
  }

  await CartItem.updateOne(
    { user: userId, product: productId },
    { $setOnInsert: { user: userId, product: productId } },
    { upsert: true }
  );
  return CartItem.findOne({ user: userId, product: productId })
    .populate({ path: 'product', populate: { path: 'seller', select: 'fullName avatar rating' } })
    .lean();
}

async function remove(userId, productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) throw invalidProductId();
  await CartItem.deleteOne({ user: userId, product: productId });
  return { productId, inCart: false };
}

async function list(userId, query = {}) {
  const { page, limit, skip } = pagination(query);
  const productIds = await getEligibleProductIds();
  const availableProducts = productIds.length
    ? await Product.find({ _id: { $in: productIds }, seller: { $ne: userId } }).distinct('_id')
    : [];
  if (!availableProducts.length) return { items: [], total: 0, page, totalPages: 0, limit };

  const filter = { user: userId, product: { $in: availableProducts } };
  const [items, total] = await Promise.all([
    CartItem.find(filter)
      .populate({ path: 'product', populate: { path: 'seller', select: 'fullName avatar rating' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CartItem.countDocuments(filter)
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit), limit };
}

module.exports = { add, remove, list };
