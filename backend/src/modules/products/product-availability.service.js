const Product = require('./product.model');
const User = require('../users/user.model');

async function getEligibleSellerIds() {
  const sellers = await User.find({
    isSuspended: { $ne: true },
    isSellingRestricted: { $ne: true }
  }).select('_id').lean();
  return sellers.map(seller => seller._id);
}

async function getEligibleProductIds(productId) {
  const sellerIds = await getEligibleSellerIds();
  if (!sellerIds.length) return [];

  const filter = { status: 'active', seller: { $in: sellerIds } };
  if (productId) filter._id = productId;
  return Product.find(filter).distinct('_id');
}

module.exports = { getEligibleSellerIds, getEligibleProductIds };
