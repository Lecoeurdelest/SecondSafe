const mongoose = require("mongoose");
const Product = require("../products/product.model");
const User = require("../users/user.model");
const Report = require("../reports/report.model");
const Order = require("../orders/order.model");
const reportService = require("../reports/report.service");
const {
  applySellingRestrictionToUser
} = require("../../common/utils/seller-restriction.util");
const business = require("../../config/business");

function parsePagination(pagination = {}) {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildRegexKeyword(keyword) {
  if (!keyword || typeof keyword !== "string") return null;
  const literal = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return literal ? new RegExp(literal, "i") : null;
}

async function buildReportedUserStatsMap(reportedUserIds = []) {
  const uniqueIds = Array.from(
    new Set(
      reportedUserIds
        .filter(Boolean)
        .map((id) => String(id))
    )
  );

  if (!uniqueIds.length) {
    return {};
  }

  const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

  const [reportCountAgg, users] = await Promise.all([
    Report.aggregate([
      { $match: { reportedUserId: { $in: objectIds } } },
      { $group: { _id: "$reportedUserId", totalReports: { $sum: 1 } } }
    ]),
    User.find({ _id: { $in: objectIds } })
      .select("_id violationCount isSuspended suspendedUntil")
      .lean()
  ]);

  const reportCountMap = reportCountAgg.reduce((acc, item) => {
    acc[String(item._id)] = item.totalReports || 0;
    return acc;
  }, {});

  const userMap = users.reduce((acc, user) => {
    acc[String(user._id)] = user;
    return acc;
  }, {});

  return uniqueIds.reduce((acc, id) => {
    const user = userMap[id] || {};
    const warningCount = Number(user.violationCount || 0);

    acc[id] = {
      warningCount,
      totalReports: Number(reportCountMap[id] || 0),
      isSuspended: Boolean(user.isSuspended),
      suspendedUntil: user.suspendedUntil || null,
      shouldLockAccount: warningCount > 0 && warningCount % 3 === 0
    };
    return acc;
  }, {});
}

async function buildProductStatsMap(productIds = []) {
  const uniqueIds = Array.from(
    new Set(
      productIds
        .filter(Boolean)
        .map((id) => String(id))
    )
  );

  if (!uniqueIds.length) {
    return {};
  }

  const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

  const [reportCountAgg, warnResolvedAgg, products] = await Promise.all([
    Report.aggregate([
      { $match: { productId: { $in: objectIds } } },
      { $group: { _id: "$productId", totalReports: { $sum: 1 } } }
    ]),
    Report.aggregate([
      {
        $match: {
          productId: { $in: objectIds },
          status: 'resolved',
          moderatorDecision: 'warn_user'
        }
      },
      { $group: { _id: "$productId", warningActions: { $sum: 1 } } }
    ]),
    Product.find({ _id: { $in: objectIds } })
      .select('_id status')
      .lean()
  ]);

  const totalReportMap = reportCountAgg.reduce((acc, item) => {
    acc[String(item._id)] = Number(item.totalReports || 0);
    return acc;
  }, {});

  const warningMap = warnResolvedAgg.reduce((acc, item) => {
    acc[String(item._id)] = Number(item.warningActions || 0);
    return acc;
  }, {});

  const productMap = products.reduce((acc, product) => {
    acc[String(product._id)] = product;
    return acc;
  }, {});

  return uniqueIds.reduce((acc, id) => {
    const product = productMap[id] || {};
    const warningActions = Number(warningMap[id] || 0);

    acc[id] = {
      totalReports: Number(totalReportMap[id] || 0),
      warningActions,
      shouldRemoveContent: warningActions >= 3,
      isRemoved: ['rejected', 'hidden', 'deleted'].includes(product.status),
      currentStatus: product.status || 'unknown'
    };

    return acc;
  }, {});
}

async function attachReportedUserStats(reports = []) {
  const ids = reports
    .map((report) => report?.reportedUserId?._id || report?.reportedUserId)
    .filter(Boolean);

  const statsMap = await buildReportedUserStatsMap(ids);
  const productIds = reports
    .map((report) => report?.productId?._id || report?.productId)
    .filter(Boolean);
  const productStatsMap = await buildProductStatsMap(productIds);

  return reports.map((report) => {
    const userId = String(report?.reportedUserId?._id || report?.reportedUserId || "");
    const productId = String(report?.productId?._id || report?.productId || "");
    return {
      ...report,
      reportedUserStats: userId ? (statsMap[userId] || null) : null,
      productStats: productId ? (productStatsMap[productId] || null) : null
    };
  });
}

// Default range: the last twelve calendar months including the current one.
function revenueRange(filters) {
  const now = new Date();
  const from = filters.from ? new Date(filters.from) : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const to = filters.to
    ? new Date(filters.to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Khoảng thời gian không hợp lệ");
  }
  return { from, to };
}

// AC-ORD-12-2: an order without a stored fee is charged the configured rate, the source the order service uses.
function orderFee(grossRevenue, storedFee) {
  return storedFee > 0 ? storedFee : Math.round(grossRevenue * business.feeRate);
}

function revenueTotals(item = {}) {
  const grossRevenue = Number(item.grossRevenue || 0);
  const platformRevenue = Number(item.platformRevenue || 0);
  return {
    completedOrders: Number(item.completedOrders || 0),
    grossRevenue,
    platformRevenue,
    sellerPayout: grossRevenue - platformRevenue
  };
}

function recentOrderRevenue(order) {
  const grossRevenue = Number(order.totalToPay || 0);
  const platformRevenue = orderFee(grossRevenue, Number(order.platformFee || 0));
  return {
    grossRevenue,
    platformRevenue,
    sellerPayout: grossRevenue - platformRevenue,
    orderId: order._id,
    orderCode: order.orderCode,
    completedAt: order.completedAt,
    productTitle: order.productId?.title || "N/A",
    buyerName: order.buyerId?.fullName || "N/A",
    sellerName: order.sellerId?.fullName || "N/A"
  };
}

async function getRevenueReport(filters = {}) {
  const { from, to } = revenueRange(filters);
  const query = { status: "completed", completedAt: { $gte: from, $lte: to } };

  const grossRevenueExpr = { $ifNull: ["$totalToPay", 0] };
  const storedFeeExpr = { $ifNull: ["$platformFee", 0] };
  const platformRevenueExpr = {
    $cond: [
      { $gt: [storedFeeExpr, 0] },
      storedFeeExpr,
      { $round: [{ $multiply: [grossRevenueExpr, business.feeRate] }, 0] }
    ]
  };
  const totals = {
    completedOrders: { $sum: 1 },
    grossRevenue: { $sum: grossRevenueExpr },
    platformRevenue: { $sum: platformRevenueExpr }
  };

  const [summaryAgg, breakdownAgg, topProducts, recentOrders] = await Promise.all([
    Order.aggregate([{ $match: query }, { $group: { _id: null, ...totals } }]),
    Order.aggregate([
      { $match: query },
      { $group: { _id: { year: { $year: "$completedAt" }, month: { $month: "$completedAt" } }, ...totals } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),
    Order.aggregate([
      { $match: query },
      { $group: { _id: "$productId", ...totals } },
      { $sort: { grossRevenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, title: "$product.title", completedOrders: 1, grossRevenue: 1, platformRevenue: 1 } }
    ]),
    Order.find(query)
      .sort({ completedAt: -1 })
      .limit(10)
      .select("orderCode totalToPay platformFee completedAt buyerId sellerId productId")
      .populate("buyerId", "fullName")
      .populate("sellerId", "fullName")
      .populate("productId", "title")
      .lean()
  ]);

  const feePercent = Math.round(business.feeRate * 10000) / 100;
  return {
    rule: {
      platformFeeRate: business.feeRate,
      formula: `Người mua thanh toán 100%, hệ thống giữ ${feePercent}%, người bán nhận ${100 - feePercent}%.`
    },
    range: { from, to },
    summary: revenueTotals(summaryAgg[0]),
    breakdown: breakdownAgg.map((item) => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      ...revenueTotals(item)
    })),
    topProducts: topProducts.map((item) => ({
      productId: item._id,
      title: item.title || "Sản phẩm đã xóa",
      ...revenueTotals(item)
    })),
    recentOrders: recentOrders.map(recentOrderRevenue)
  };
}

async function banUser(userId, suspendedReason = "") {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại");
  if (user.role === "admin") {
    throw new Error("Không thể khóa tài khoản admin");
  }
  user.violationCount = (user.violationCount || 0) + 1;

  await applySellingRestrictionToUser(user, {
    reason: String(suspendedReason || '').trim() || 'Tài khoản bị hạn chế quyền bán bởi moderator.',
    source: 'moderator_ban'
  });

  return {
    user,
    suspendedReason
  };
}

async function getReports(filters = {}, pagination = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.reportType) query.reportType = filters.reportType;

  const keywordRegex = buildRegexKeyword(filters.keyword);
  if (keywordRegex) {
    query.$or = [
      { reason: keywordRegex },
      { description: keywordRegex }
    ];
  }

  const { page, limit, skip } = parsePagination(pagination);
  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("reporterId", "fullName email avatar")
    .populate("reportedUserId", "fullName email avatar violationCount isSuspended suspendedUntil isSellingRestricted sellingRestrictedUntil sellingRestrictedReason")
    .populate("productId", "title images")
    .lean();

  const reportsWithStats = await attachReportedUserStats(reports);

  const total = await Report.countDocuments(query);
  return {
    reports: reportsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getReportById(reportId) {
  const report = await Report.findById(reportId)
    .populate("reporterId", "fullName email avatar")
    .populate("reportedUserId", "fullName email avatar violationCount isSuspended suspendedUntil isSellingRestricted sellingRestrictedUntil sellingRestrictedReason")
    .populate("productId", "title images price")
    .lean();

  if (!report) {
    throw new Error("Báo cáo không tồn tại");
  }

  const reportWithStats = await attachReportedUserStats([report]);
  return reportWithStats[0];
}

async function resolveReport(reportId, moderatorId, payload) {
  const { status, moderatorDecision, moderatorNotes, moderatorReply, moderatorReplyToReportedUser } = payload;
  return reportService.resolveReport(
    reportId,
    moderatorId,
    status,
    moderatorDecision,
    moderatorNotes,
    moderatorReply,
    moderatorReplyToReportedUser
  );
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

module.exports = {
  isValidObjectId,
  getRevenueReport,
  banUser,
  getReports,
  getReportById,
  resolveReport
};
