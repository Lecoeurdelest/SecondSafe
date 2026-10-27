const User = require('../users/user.model');
const Order = require('../orders/order.model');
const PurchaseRequest = require('../orders/purchase-request.model');
const Report = require('../reports/report.model');
const Dispute = require('../reports/dispute.model');
const Transaction = require('../payments/transaction.model');
const Review = require('../reports/review.model');
const Delivery = require('../delivery/delivery.model');

async function countBy(model, field) {
  const rows = await model.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } }
  ]);
  return Object.fromEntries(rows.map(row => [row._id || 'unknown', row.count]));
}

function sumStatuses(byStatus, statuses) {
  return statuses.reduce((total, status) => total + (byStatus[status] || 0), 0);
}

async function getDashboard() {
  const [
    purchaseRequestsByStatus,
    reportStatuses,
    disputeStatuses,
    orderStatuses,
    deliveryStatuses,
    suspendedUsers,
    pendingWithdrawals,
    unreviewedReviews,
    latestReports
  ] = await Promise.all([
    countBy(PurchaseRequest, 'status'),
    countBy(Report, 'status'),
    countBy(Dispute, 'status'),
    countBy(Order, 'status'),
    countBy(Delivery, 'status'),
    User.countDocuments({ isSuspended: true }),
    Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
    Review.countDocuments({
      status: 'active',
      $or: [
        { 'moderatorAssessment.isReviewed': false },
        { 'moderatorAssessment.isReviewed': { $exists: false } }
      ]
    }),
    Report.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id reportType reason status createdAt')
      .lean()
  ]);

  const openDisputes = sumStatuses(disputeStatuses, ['pending', 'investigating']);
  const openOrders = sumStatuses(orderStatuses, [
    'awaiting_seller_confirmation', 'awaiting_payment', 'paid', 'shipped', 'delivered', 'disputed'
  ]);
  const activeDeliveries = sumStatuses(deliveryStatuses, [
    'pending', 'picked_up', 'in_transit', 'out_for_delivery'
  ]);
  return {
    generatedAt: new Date(),
    pendingReports: reportStatuses.pending || 0,
    reviewingReports: reportStatuses.reviewing || 0,
    pendingWithdrawals,
    unreviewedReviews,
    suspendedUsers,
    pendingPurchaseRequests: purchaseRequestsByStatus.pending || 0,
    openOrders,
    openDisputes,
    activeDeliveries,
    latestReports: latestReports.map(report => ({
      id: String(report._id),
      reportType: report.reportType,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt
    })),
    recentQueue: [
      { label: 'Báo cáo cần xem xét', count: (reportStatuses.pending || 0) + (reportStatuses.reviewing || 0) },
      { label: 'Tranh chấp cần xem xét', count: openDisputes },
      { label: 'Yêu cầu mua đang chờ', count: purchaseRequestsByStatus.pending || 0 },
      { label: 'Đơn hàng chưa hoàn tất', count: openOrders },
      { label: 'Đơn đang vận chuyển', count: activeDeliveries }
    ]
  };
}

module.exports = { getDashboard };
