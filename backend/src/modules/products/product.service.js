const mongoose = require('mongoose');
const Category = require('./category.model');
const Product = require('./product.model');
const { getEligibleSellerIds } = require('./product-availability.service');
const { pagination } = require('../../common/utils/pagination.util');

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

// Narrows the eligible sellers to one seller when a public profile asks for that seller's listings.
async function sellerFilter(sellerId) {
  const sellerIds = await getEligibleSellerIds();
  if (sellerId === undefined || sellerId === '') return sellerIds;
  if (typeof sellerId !== 'string' || !mongoose.Types.ObjectId.isValid(sellerId)) return [];
  return sellerIds.filter(id => String(id) === sellerId);
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

  const sellerIds = await sellerFilter(query.seller);
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

async function findProduct(filter) {
  return Product.findOne(filter)
    .populate('category', 'name slug')
    .populate('categories', 'name slug')
    .populate('seller', 'fullName avatar rating')
    .lean();
}

// The owner can open their own hidden or reserved listing; everyone else only sees active listings of eligible sellers.
async function getProductById(id, viewerId) {
  const notFound = Object.assign(new Error('Không tìm thấy sản phẩm'), { statusCode: 404 });
  if (!mongoose.Types.ObjectId.isValid(id)) throw notFound;

  if (viewerId) {
    const own = await findProduct({ _id: id, seller: viewerId, status: { $ne: 'deleted' } });
    if (own) return own;
  }

  const sellerIds = await getEligibleSellerIds();
  const product = sellerIds.length
    ? await findProduct({ _id: id, status: 'active', seller: { $in: sellerIds } })
    : null;
  if (!product) throw notFound;
  return product;
}

module.exports = { listProducts, getProductById };
