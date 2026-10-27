const User = require('./user.model');
const Product = require('../products/product.model');
const Category = require('../products/category.model');
const Order = require('../orders/order.model');
const PurchaseRequest = require('../orders/purchase-request.model');
const Report = require('../reports/report.model');
const Dispute = require('../reports/dispute.model');
const Transaction = require('../payments/transaction.model');
const Wallet = require('../payments/wallet.model');
const Review = require('../reports/review.model');
const Delivery = require('../delivery/delivery.model');

async function countBy(model, field) {
  const rows = await model.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } }
  ]);
  return Object.fromEntries(rows.map(row => [row._id || 'unknown', row.count]));
}

function sumCounts(byStatus) {
  return Object.values(byStatus).reduce((total, count) => total + count, 0);
}

function recentMonthSeries(rows, now = new Date()) {
  const counts = new Map(rows.map(row => [row._id, row.count]));
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      month: date.toLocaleDateString('vi-VN', { month: 'short', timeZone: 'UTC' }),
      count: counts.get(key) || 0
    };
  });
}

async function getDashboard() {
  const [
    usersByRole,
    usersByStatus,
    productsByStatus,
    productsByCategory,
    ordersByStatus,
    orderValue,
    ordersByMonth,
    purchaseRequestsByStatus,
    reportsByStatus,
    disputesByStatus,
    transactionsByType,
    feeRevenue,
    walletTotals,
    reviewsByStatus,
    reviewRating,
    deliveriesByStatus,
    pendingWithdrawals
  ] = await Promise.all([
    countBy(User, 'role'),
    User.aggregate([
      { $group: { _id: { $cond: ['$isSuspended', 'suspended', 'active'] }, count: { $sum: 1 } } }
    ]).then(rows => Object.fromEntries(rows.map(row => [row._id, row.count]))),
    countBy(Product, 'status'),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, category: { $ifNull: ['$categoryInfo.name', 'Khác'] }, count: 1 } },
      { $sort: { count: -1, category: 1 } }
    ]),
    countBy(Order, 'status'),
    Order.aggregate([
      { $group: { _id: null, total: { $sum: '$agreedAmount' } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5, 1)) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } }
    ]),
    countBy(PurchaseRequest, 'status'),
    countBy(Report, 'status'),
    countBy(Dispute, 'status'),
    countBy(Transaction, 'type'),
    Transaction.aggregate([
      { $match: { type: 'fee', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Wallet.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, balanceVnd: { $sum: '$balance' } } }
    ]),
    countBy(Review, 'status'),
    Review.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]),
    countBy(Delivery, 'status'),
    Transaction.countDocuments({ type: 'withdrawal', status: 'pending' })
  ]);

  const wallets = walletTotals[0] || { total: 0, balanceVnd: 0 };
  const activeReviewCount = reviewsByStatus.active || 0;
  const averageRating = reviewRating[0]?.averageRating || 0;
  return {
    generatedAt: new Date(),
    users: {
      total: sumCounts(usersByRole),
      byRole: usersByRole,
      byStatus: usersByStatus
    },
    products: {
      total: sumCounts(productsByStatus),
      byStatus: productsByStatus,
      byCategory: productsByCategory
    },
    orders: {
      total: sumCounts(ordersByStatus),
      byStatus: ordersByStatus,
      valueVnd: orderValue[0]?.total || 0,
      monthly: recentMonthSeries(ordersByMonth)
    },
    purchaseRequests: { total: sumCounts(purchaseRequestsByStatus), byStatus: purchaseRequestsByStatus },
    reports: { total: sumCounts(reportsByStatus), byStatus: reportsByStatus },
    disputes: { total: sumCounts(disputesByStatus), byStatus: disputesByStatus },
    transactions: {
      total: sumCounts(transactionsByType),
      byType: transactionsByType,
      feeRevenueVnd: feeRevenue[0]?.total || 0
    },
    wallets: { total: wallets.total, balanceVnd: wallets.balanceVnd },
    reviews: {
      total: sumCounts(reviewsByStatus),
      active: activeReviewCount,
      averageRating: Math.round(averageRating * 10) / 10
    },
    deliveries: { total: sumCounts(deliveriesByStatus), byStatus: deliveriesByStatus },
    pendingWithdrawals
  };
}

module.exports = { getDashboard, recentMonthSeries };
