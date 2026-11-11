const mongoose = require('mongoose');
const Favorite = require('./favorite.model');
const { getEligibleProductIds } = require('../products/product-availability.service');
const { pagination } = require('../../common/utils/pagination.util');

function invalidProductId() {
  return Object.assign(new Error('ID sản phẩm không hợp lệ'), { statusCode: 400 });
}

async function add(userId, productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) throw invalidProductId();

  const products = await getEligibleProductIds(productId);
  if (!products.length) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm đang được bán'), { statusCode: 404 });
  }

  await Favorite.updateOne(
    { user: userId, product: productId },
    { $setOnInsert: { user: userId, product: productId } },
    { upsert: true }
  );
  return Favorite.findOne({ user: userId, product: productId })
    .populate({ path: 'product', populate: { path: 'seller', select: 'fullName avatar rating' } })
    .lean();
}

async function remove(userId, productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) throw invalidProductId();
  await Favorite.deleteOne({ user: userId, product: productId });
  return { productId, isFavorite: false };
}

async function check(userId, productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) throw invalidProductId();
  const productIds = await getEligibleProductIds(productId);
  if (!productIds.length) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm đang được bán'), { statusCode: 404 });
  }
  const favorite = await Favorite.exists({ user: userId, product: productId });
  return { productId, isFavorite: Boolean(favorite) };
}

async function list(userId, query = {}) {
  const { page, limit, skip } = pagination(query);
  const productIds = await getEligibleProductIds();
  if (!productIds.length) return { favorites: [], total: 0, page, totalPages: 0, limit };

  const filter = { user: userId, product: { $in: productIds } };
  const [favorites, total] = await Promise.all([
    Favorite.find(filter)
      .populate({ path: 'product', populate: { path: 'seller', select: 'fullName avatar rating' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Favorite.countDocuments(filter)
  ]);
  return { favorites, total, page, totalPages: Math.ceil(total / limit), limit };
}

module.exports = { add, remove, check, list };
