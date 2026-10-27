const EXPORT_FILES = [
  'cartitems', 'categories', 'conversations', 'deliveries', 'disputes', 'escrowholds',
  'favorites', 'messages', 'notifications', 'orders', 'products', 'purchaserequests',
  'reviews', 'transactions', 'users', 'wallets'
];

function rowsFor(data, name) {
  const rows = Array.isArray(data) ? data : data?.data || data?.results || data?.items;
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new Error(`${name}.json must contain an array of documents`);
  }
  return rows;
}

function groupCount(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    const key = typeof row[field] === 'string' && row[field].trim()
      ? row[field].trim().slice(0, 60)
      : 'unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries(counts);
}

function sumField(rows, field) {
  return rows.reduce((total, row, index) => {
    const value = row[field];
    if (value === undefined || value === null) return total;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${field} in record ${index + 1} must be a non-negative integer`);
    }
    const sum = total + value;
    if (!Number.isSafeInteger(sum)) throw new Error(`${field} total exceeds the safe integer range`);
    return sum;
  }, 0);
}

function dateValue(value) {
  const raw = value && typeof value === 'object' && '$date' in value ? value.$date : value;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthlyOrderCounts(orders) {
  const months = new Map();
  for (const order of orders) {
    const date = dateValue(order.createdAt);
    if (!date) continue;
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    months.set(month, (months.get(month) || 0) + 1);
  }
  return [...months.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));
}

function summarizeExports(exportsByName, importedAt = new Date()) {
  const data = Object.fromEntries(EXPORT_FILES.map(name => [name, rowsFor(exportsByName[name], name)]));
  const categoriesById = new Map(data.categories.map(category => [String(category._id), category.name]));
  const productsByCategory = new Map();
  for (const product of data.products) {
    const category = categoriesById.get(String(product.categoryId)) || 'Khác';
    productsByCategory.set(category, (productsByCategory.get(category) || 0) + 1);
  }

  const feeTransactions = data.transactions.filter(transaction =>
    transaction.type === 'fee' && ['success', 'completed'].includes(transaction.status));
  const reviewRatings = data.reviews.map(review => review.rating).filter(Number.isFinite);
  const totalRating = reviewRatings.reduce((sum, rating) => sum + rating, 0);

  return {
    _id: 'latest',
    importedAt,
    sourceRecordCount: Object.fromEntries(EXPORT_FILES.map(name => [name, data[name].length])),
    users: { total: data.users.length, byRole: groupCount(data.users, 'role'), byStatus: groupCount(data.users, 'status') },
    products: {
      total: data.products.length,
      byStatus: groupCount(data.products, 'status'),
      byCategory: [...productsByCategory.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category))
        .slice(0, 8)
    },
    orders: {
      total: data.orders.length,
      byStatus: groupCount(data.orders, 'status'),
      valueVnd: sumField(data.orders, 'totalAmount'),
      monthly: monthlyOrderCounts(data.orders)
    },
    purchaseRequests: { total: data.purchaserequests.length, byStatus: groupCount(data.purchaserequests, 'status') },
    disputes: { total: data.disputes.length, byStatus: groupCount(data.disputes, 'status') },
    transactions: {
      total: data.transactions.length,
      byType: groupCount(data.transactions, 'type'),
      feeRevenueVnd: sumField(feeTransactions, 'amount')
    },
    wallets: { total: data.wallets.length, balanceVnd: sumField(data.wallets, 'balance') },
    reviews: {
      total: data.reviews.length,
      averageRating: reviewRatings.length ? Math.round((totalRating / reviewRatings.length) * 10) / 10 : 0
    },
    deliveries: { total: data.deliveries.length, byStatus: groupCount(data.deliveries, 'status') }
  };
}

module.exports = { EXPORT_FILES, rowsFor, dateValue, summarizeExports };
