const mongoose = require("mongoose");

const Product = require("../products/product.model");
const User = require("../users/user.model");
const Report = require("../reports/report.model");
const Order = require("../orders/order.model");
const Review = require("../reports/review.model");
const Dispute = require("../reports/dispute.model");
const reviewService = require("../reports/review.service");
const reportService = require("../reports/report.service");
const orderService = require("../orders/order.service");
const escrowService = require("../payments/escrow.service");
const EscrowHold = require("../payments/escrow-hold.model");
const notificationService = require("../notifications/notification.service");
const {
  applySellingRestrictionToUser
} = require("../../common/utils/seller-restriction.util");
const business = require("../../config/business");
const logger = require("../../common/utils/logger.util");

const SANCTION_LABELS = ["24 giờ", "1 tuần", "1 năm"];

function normalizeOrderStatus(status, confirmedBySeller = false) {
  if (status === "pending") {
    return confirmedBySeller ? "awaiting_payment" : "awaiting_seller_confirmation";
  }

  // Legacy status: don da giao thanh cong nhung chua dong bo voi flow moi.
  if (status === "delivered") {
    return "shipped";
  }

  return status;
}

// Luồng trạng thái đơn hàng cho moderator: chỉ đi tới trước, không cho quay ngược.
const MODERATOR_ORDER_TRANSITIONS = {
  awaiting_seller_confirmation: ["cancelled"],
  pending: ["cancelled"],
  awaiting_payment: ["cancelled"],
  paid: ["shipped", "disputed", "cancelled"],
  delivered: ["completed", "disputed"],
  shipped: ["completed", "disputed"],
  disputed: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

function getAllowedNextStatuses(currentStatus) {
  return MODERATOR_ORDER_TRANSITIONS[currentStatus] || [];
}

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

async function autoApproveHighRatingReviews() {
  await Review.updateMany(
    {
      rating: { $gte: 4 },
      "moderatorAssessment.isReviewed": { $ne: true },
      "moderatorAssessment.isBad": { $ne: true },
      "moderatorAssessment.verdict": { $nin: ["good", "bad"] }
    },
    {
      $set: {
        "moderatorAssessment.isReviewed": true,
        "moderatorAssessment.isBad": false,
        "moderatorAssessment.verdict": "good",
        "moderatorAssessment.note": "Tự động duyệt: đánh giá từ 4 sao trở lên",
        "moderatorAssessment.markedAt": new Date(),
        "moderatorAssessment.penaltyLevel": 0
      }
    }
  );
}

function normalizeReviewMediaFields(reviewDoc) {
  if (!reviewDoc) return reviewDoc;

  const raw = typeof reviewDoc.toObject === 'function'
    ? reviewDoc.toObject()
    : reviewDoc;

  const candidates = [
    raw?.evidenceFiles,
    raw?.evidenceImages,
    raw?.media,
    raw?.attachments,
    raw?.data?.evidenceFiles,
    raw?.data?.evidenceImages
  ];

  const unifiedEvidenceFiles = Array.from(
    new Set(
      candidates
        .filter(Array.isArray)
        .flat()
        .map((file) => String(file || '').trim())
        .filter(Boolean)
        .filter((file) => /\.(png|jpe?g|mp4)$/i.test(file))
    )
  ).slice(0, 5);

  return {
    ...raw,
    evidenceFiles: unifiedEvidenceFiles,
    evidenceImages: unifiedEvidenceFiles
  };
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

async function getOrders(filters = {}, pagination = {}) {
  const query = {};
  if (filters.status === "awaiting_payment") {
    query.status = { $in: ["awaiting_payment", "pending"] };
  } else if (filters.status === "shipped") {
    query.status = { $in: ["shipped", "delivered"] };
  } else if (filters.status) {
    query.status = filters.status;
  }

  const keywordRegex = buildRegexKeyword(filters.keyword);
  const { page, limit, skip } = parsePagination(pagination);

  let orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("buyerId", "fullName email phone address")
    .populate("sellerId", "fullName email phone address")
    .populate("productId", "title images price")
    .lean();

  if (keywordRegex) {
    orders = orders.filter((order) => {
      const buyer = order.buyerId?.fullName || "";
      const seller = order.sellerId?.fullName || "";
      const product = order.productId?.title || "";
      return (
        keywordRegex.test(String(order._id)) ||
        keywordRegex.test(buyer) ||
        keywordRegex.test(seller) ||
        keywordRegex.test(product)
      );
    });
  }

  const normalizedOrders = orders.map((order) => ({
    ...order,
    status: normalizeOrderStatus(order.status, order.confirmedBySeller)
  }));

  const total = await Order.countDocuments(query);
  return {
    orders: normalizedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate("buyerId", "fullName email phone address avatar")
    .populate("sellerId", "fullName email phone address avatar")
    .populate("productId", "title images price")
    .populate("requestId");

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  const normalizedStatus = normalizeOrderStatus(order.status, order.confirmedBySeller);

  return {
    ...order.toObject(),
    status: normalizedStatus,
    allowedNextStatuses: getAllowedNextStatuses(normalizedStatus)
  };
}

async function forceCancelOrder(orderId, moderatorId, reason) {
  return orderService.forceCancelOrder(orderId, moderatorId, reason);
}

// Cập nhật trạng thái đơn từ moderator, có kiểm soát chuyển trạng thái để tránh sai luồng.
async function updateOrderStatusByModerator(orderId, nextStatus, moderatorId, note = "") {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  const currentStatus = normalizeOrderStatus(order.status, order.confirmedBySeller);
  const allowedNextStatuses = getAllowedNextStatuses(currentStatus);
  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new Error(
      `Không thể chuyển từ ${currentStatus} sang ${nextStatus}. Trạng thái hợp lệ tiếp theo: ${allowedNextStatuses.join(", ") || "không có"}`
    );
  }

  const reason = String(note || "").trim();
  if (nextStatus === "cancelled") {
    if (reason.length < 10) throw new Error("Khi hủy đơn, ghi chú phải có ít nhất 10 ký tự");
    // Refunds any escrow hold and reopens the listing in one transaction.
    await orderService.forceCancelOrder(orderId, moderatorId, reason);
    return getOrderById(orderId);
  }

  if (nextStatus === "completed") {
    await completeOrderByModerator(order, reason);
    return getOrderById(orderId);
  }

  order.status = nextStatus;
  if (nextStatus === "shipped") {
    order.shippedAt = order.shippedAt || new Date();
  }
  await order.save();
  return getOrderById(orderId);
}

// A manual escrow release pays the seller but leaves the order to its caller.
async function completeReleasedOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order || order.status === "completed") return;
  order.status = "completed";
  order.paymentStatus = "paid";
  order.completedAt = new Date();
  await order.save();
  if (order.productId) {
    await Product.findByIdAndUpdate(order.productId, { status: "sold" });
  }
}

// Completing an order pays the seller from escrow, then completes the order and marks the listing sold.
async function completeOrderByModerator(order, reason) {
  const hold = await EscrowHold.findOne({ orderId: order._id });
  if (!hold || hold.status !== "held") {
    throw new Error("Không thể hoàn tất đơn hàng khi tiền ký quỹ không còn được giữ");
  }
  await escrowService.releaseFunds(
    String(order._id),
    reason || "Moderator xác nhận hoàn tất đơn hàng",
    false
  );
  await completeReleasedOrder(order._id);
}

async function getReviews(filters = {}, pagination = {}) {
  // Luong mod review: loc theo status va trang thai tham dinh cua moderator.
  await autoApproveHighRatingReviews();

  const query = {};
  if (filters.status) query.status = filters.status;

  if (filters.assessment === 'pending') {
    query['moderatorAssessment.isReviewed'] = { $ne: true };
    query['moderatorAssessment.isBad'] = { $ne: true };
    query['moderatorAssessment.verdict'] = { $nin: ['good', 'bad'] };
  } else if (filters.assessment === 'good') {
    query['moderatorAssessment.isReviewed'] = true;
    query['moderatorAssessment.isBad'] = { $ne: true };
  } else if (filters.assessment === 'bad') {
    query['moderatorAssessment.isBad'] = true;
  }

  const keywordRegex = buildRegexKeyword(filters.keyword);
  if (keywordRegex) {
    // Tim keyword tren user, product va noi dung comment.
    const [matchedUsers, matchedProducts] = await Promise.all([
      User.find({ fullName: keywordRegex }).select('_id').lean(),
      Product.find({ title: keywordRegex }).select('_id').lean()
    ]);

    const userIds = matchedUsers.map((user) => user._id);
    const productIds = matchedProducts.map((product) => product._id);
    const orFilters = [{ comment: keywordRegex }];

    if (userIds.length) {
      orFilters.push({ reviewerId: { $in: userIds } });
      orFilters.push({ reviewedUserId: { $in: userIds } });
    }

    if (productIds.length) {
        orFilters.push({ productId: { $in: productIds } });
    }

    query.$or = orFilters;
  }

  const { page, limit, skip } = parsePagination(pagination);
  const reviews = await Review.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("reviewerId", "fullName email")
    .populate("reviewedUserId", "fullName email totalReviews isSuspended suspendedUntil isSellingRestricted sellingRestrictedUntil sellingRestrictedReason modBadReviewCount")
    .populate("moderatorAssessment.moderatorId", "fullName email")
    .populate("productId", "title images")
    .populate("orderId", "status agreedAmount");

  const total = await Review.countDocuments(query);
  return {
    reviews: reviews.map(normalizeReviewMediaFields),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function hideReview(reviewId) {
  // An review vi pham va cap nhat lai diem seller.
  const review = await Review.findById(reviewId);
  if (!review) throw new Error("Đánh giá không tồn tại");
  if (review.status === "hidden") throw new Error("Đánh giá đã bị ẩn trước đó");

  review.status = "hidden";
  await review.save();
  await reviewService.updateUserRating(review.reviewedUserId);
  return review;
}

function getModerationSuspensionConfig(level) {
  const index = Math.min(Math.max(level, 1), business.sanctionDurationsMs.length) - 1;
  return { durationMs: business.sanctionDurationsMs[index], label: SANCTION_LABELS[index] };
}

const MODERATED_REVIEW_POPULATION = [
  { path: 'reviewerId', select: 'fullName email' },
  { path: 'reviewedUserId', select: 'fullName email isSuspended suspendedUntil isSellingRestricted sellingRestrictedUntil sellingRestrictedReason modBadReviewCount' },
  { path: 'moderatorAssessment.moderatorId', select: 'fullName email' },
  { path: 'productId', select: 'title images' },
  { path: 'orderId', select: 'status agreedAmount' }
];

async function requireUnjudgedReview(reviewId) {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error('Đánh giá không tồn tại');
  if (review?.moderatorAssessment?.isReviewed || review?.moderatorAssessment?.isBad) {
    throw new Error('Đánh giá này đã được moderator xử lý trước đó');
  }
  return review;
}

// AC-MOD-05-2: every bad review counts; a selling restriction starts at each configured threshold.
async function recordBadReview(seller, note) {
  const sanctionStep = business.sanctionThresholds[0];
  const nextCount = Number(seller.modBadReviewCount || 0) + 1;
  const penaltyLevel = Math.min(Math.floor(nextCount / sanctionStep), business.sanctionDurationsMs.length);
  const shouldSuspendNow = nextCount % sanctionStep === 0;
  seller.modBadReviewCount = nextCount;
  if (!shouldSuspendNow) {
    await seller.save();
    return { nextCount, penaltyLevel, shouldSuspendNow, suspensionConfig: null };
  }
  const suspensionConfig = getModerationSuspensionConfig(penaltyLevel);
  await applySellingRestrictionToUser(seller, {
    durationMs: suspensionConfig.durationMs,
    reason: `Vi phạm đánh giá do moderator xử lý (mức ${penaltyLevel}/3). ${String(note || '').trim()}`,
    source: 'review_moderation'
  });
  return { nextCount, penaltyLevel, shouldSuspendNow, suspensionConfig };
}

async function notifySellerOfBadReview(seller, review, moderatorId, note, penalty) {
  const detailMessage = String(note || '').trim()
    ? `Nội dung từ moderator: ${String(note).trim()}`
    : 'Vui lòng rà soát chất lượng sản phẩm và cách phục vụ.';
  const resultMessage = penalty.suspensionConfig
    ? `Tài khoản bị hạn chế quyền bán ${penalty.suspensionConfig.label} sau mốc ${penalty.nextCount} đánh giá xấu.`
    : `Đã ghi nhận ${penalty.nextCount} đánh giá xấu. Tài khoản sẽ bị hạn chế quyền bán khi đạt các mốc 3/6/9.`;
  try {
    await notificationService.createNotification(seller._id, {
      type: 'system',
      senderId: moderatorId,
      reviewId: review._id,
      title: 'Tài khoản bị hạn chế do đánh giá kiểm duyệt',
      message: `Moderator đã đánh dấu 1 đánh giá xấu cho tài khoản của bạn. ${resultMessage} ${detailMessage}`
    });
  } catch (notificationError) {
    logger.error('Error sending seller moderation notification:', notificationError);
  }
}

async function markSellerBadByReview(reviewId, moderatorId, note = '') {
  const review = await requireUnjudgedReview(reviewId);
  const seller = await User.findById(review.reviewedUserId);
  if (!seller) throw new Error('Không tìm thấy người bán để xử lý');
  if (seller.role === 'admin') throw new Error('Không thể xử phạt tài khoản admin');

  const penalty = await recordBadReview(seller, note);
  review.moderatorAssessment = {
    isReviewed: true,
    isBad: true,
    verdict: 'bad',
    moderatorId,
    note,
    markedAt: new Date(),
    penaltyLevel: penalty.penaltyLevel
  };
  await review.save();
  await notifySellerOfBadReview(seller, review, moderatorId, note, penalty);
  await review.populate(MODERATED_REVIEW_POPULATION);

  return {
    review,
    sellerPenalty: {
      modBadReviewCount: penalty.nextCount,
      penaltyLevel: penalty.penaltyLevel,
      isSuspended: Boolean(seller.isSuspended),
      isSellingRestricted: Boolean(seller.isSellingRestricted),
      sellingRestrictedUntil: seller.sellingRestrictedUntil || null,
      suspensionLabel: penalty.suspensionConfig?.label || null,
      shouldSuspendNow: penalty.shouldSuspendNow
    }
  };
}

async function markSellerGoodByReview(reviewId, moderatorId, note = '') {
  const review = await requireUnjudgedReview(reviewId);
  review.moderatorAssessment = {
    isReviewed: true,
    isBad: false,
    verdict: 'good',
    moderatorId,
    note,
    markedAt: new Date(),
    penaltyLevel: 0
  };
  await review.save();
  await review.populate(MODERATED_REVIEW_POPULATION);

  return {
    review
  };
}

const DISPUTE_QUEUE_ORDER = ["pending", "investigating", "resolved"];

function populateDisputes(query) {
  return query
    .populate("orderId", "agreedAmount totalToPay status")
    .populate("buyerId", "fullName email avatar violationCount isSuspended isSellingRestricted sellingRestrictedUntil")
    .populate("sellerId", "fullName email avatar violationCount isSuspended isSellingRestricted sellingRestrictedUntil")
    .populate("productId", "title images")
    .populate("moderatorId", "fullName email");
}

// The default queue shows pending, then investigating, then resolved, each newest first.
async function pageDisputeQueue(skip, limit) {
  const disputes = [];
  let offset = skip;
  for (const status of DISPUTE_QUEUE_ORDER) {
    if (disputes.length >= limit) break;
    const count = await Dispute.countDocuments({ status });
    if (offset >= count) {
      offset -= count;
      continue;
    }
    const page = await populateDisputes(
      Dispute.find({ status }).sort({ createdAt: -1 }).skip(offset).limit(limit - disputes.length)
    );
    disputes.push(...page);
    offset = 0;
  }
  return disputes;
}

async function getDisputes(filters = {}, pagination = {}) {
  const { page, limit, skip } = parsePagination(pagination);
  const query = filters.status ? { status: filters.status } : {};
  const [disputes, total] = await Promise.all([
    filters.status
      ? populateDisputes(Dispute.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit))
      : pageDisputeQueue(skip, limit),
    Dispute.countDocuments(query)
  ]);

  return {
    disputes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getDisputeById(disputeId) {
  const dispute = await Dispute.findById(disputeId)
    .populate("orderId", "agreedAmount totalToPay status paymentStatus")
    .populate("buyerId", "fullName email avatar violationCount isSuspended isSellingRestricted sellingRestrictedUntil")
    .populate("sellerId", "fullName email avatar violationCount isSuspended isSellingRestricted sellingRestrictedUntil")
    .populate("productId", "title images price")
    .populate("moderatorId", "fullName email")
    .populate("moderatorUpdates.moderatorId", "fullName email")
    .populate("disputeConversation.senderId", "fullName email avatar");

  if (!dispute) {
    throw new Error("Khiếu nại không tồn tại");
  }

  return dispute;
}

// Moderator gui cap nhat trong dispute: chi luu vao dien bien tranh chap + thong bao 2 ben.
async function sendDisputeModeratorMessage(disputeId, moderatorId, content) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }

  const normalizedContent = String(content || '').trim();
  if (!normalizedContent) {
    throw new Error('Nội dung tin nhắn không được để trống');
  }

  dispute.moderatorUpdates = [
    ...(dispute.moderatorUpdates || []),
    {
      moderatorId,
      content: normalizedContent,
      createdAt: new Date()
    }
  ];

  dispute.disputeConversation = [
    ...(dispute.disputeConversation || []),
    {
      senderRole: 'moderator',
      senderId: moderatorId,
      content: normalizedContent,
      evidenceFiles: [],
      createdAt: new Date()
    }
  ];
  await dispute.save();

  await Promise.all([
    pushDisputeNotification(dispute.buyerId, 'Moderator có cập nhật mới', 'Moderator vừa gửi cập nhật mới trong khiếu nại. Vui lòng kiểm tra và phản hồi.', disputeId),
    pushDisputeNotification(dispute.sellerId, 'Moderator có cập nhật mới', 'Moderator vừa gửi cập nhật mới trong khiếu nại. Vui lòng kiểm tra và phản hồi.', disputeId)
  ]);

  const updatedDispute = await getDisputeById(disputeId);

  return {
    message: {
      type: 'moderator_update',
      content: normalizedContent,
      createdAt: new Date()
    },
    dispute: updatedDispute
  };
}

async function increaseViolationAndMaybeSuspend(userId) {
  const user = await User.findById(userId);
  if (!user || user.role === "admin") return null;

  user.violationCount = (user.violationCount || 0) + 1;
  if (user.violationCount >= business.disputeRestrictionThreshold) {
    await applySellingRestrictionToUser(user, {
      durationMs: business.disputeRestrictionDurationMs,
      reason: 'Tài khoản bị hạn chế quyền bán do vi phạm nhiều lần trong xử lý khiếu nại.',
      source: 'dispute_violation'
    });
    return user;
  }

  await user.save();
  return user;
}

// AC-MOD-06-2: refund returns the escrow hold to the buyer.
async function refundDisputedOrder(orderId, escrowHold) {
  if (escrowHold.status === "released") {
    throw new Error("Tiền đã nhả cho người bán, không thể hoàn tiền cho người mua");
  }
  if (escrowHold.status === "held") {
    await escrowService.refundFunds(orderId, "Tranh chấp đã xử lý: Hoàn tiền cho người mua");
  }
}

// AC-MOD-06-2: release pays the seller, completes the order and marks the listing sold.
async function releaseDisputedOrder(orderId, escrowHold) {
  if (escrowHold.status === "refunded") {
    throw new Error("Tiền đã hoàn cho người mua, không thể nhả lại cho người bán");
  }
  if (escrowHold.status === "held") {
    await escrowService.releaseFunds(orderId, "Tranh chấp đã xử lý: Nhả tiền cho người bán", false);
  }
  await completeReleasedOrder(orderId);
}

const DISPUTE_SETTLEMENTS = { refund: refundDisputedOrder, release: releaseDisputedOrder };

async function resolveDispute(disputeId, moderatorId, payload) {
  const { resolution, moderatorNotes } = payload;
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    throw new Error("Khiếu nại không tồn tại");
  }
  if (dispute.status === "resolved") {
    throw new Error("Khiếu nại đã được xử lý trước đó");
  }
  // AC-MOD-06-1: a dispute is settled only after it has been investigated.
  if (dispute.status !== "investigating") {
    throw new Error("Cần chuyển khiếu nại sang trạng thái điều tra trước khi xử lý");
  }
  if (!DISPUTE_SETTLEMENTS[resolution]) {
    throw new Error("Hướng xử lý khiếu nại không hợp lệ");
  }

  const orderId = dispute.orderId.toString();
  const escrowHold = await EscrowHold.findOne({ orderId });
  if (!escrowHold) {
    throw new Error("Không tìm thấy tiền ký quỹ cho đơn hàng này");
  }
  await DISPUTE_SETTLEMENTS[resolution](orderId, escrowHold);

  // AC-MOD-06-3: the party the decision goes against records a dispute violation.
  await increaseViolationAndMaybeSuspend(resolution === "refund" ? dispute.sellerId : dispute.buyerId);

  dispute.status = "resolved";
  dispute.resolution = resolution;
  dispute.moderatorNotes = moderatorNotes || "";
  dispute.moderatorId = moderatorId;
  dispute.resolvedAt = new Date();
  await dispute.save();

  return getDisputeById(disputeId);
}

async function pushDisputeNotification(userId, title, msg, disputeId) {
  // Ham dung chung de day thong bao cap nhat tranh chap.
  if (!userId) return;
  await notificationService.createNotification(userId, {
    type: 'dispute_update',
    title,
    message: msg,
    disputeId
  });
}

// Chuyen tranh chap sang "investigating" de mo pha dieu tra trung gian.
async function markDisputeInvestigating(disputeId, moderatorId, note = "") {
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    throw new Error("Khiếu nại không tồn tại");
  }

  if (dispute.status === "resolved") {
    throw new Error("Khiếu nại đã được xử lý, không thể chuyển investigating");
  }

  dispute.status = "investigating";
  dispute.moderatorId = moderatorId;
  if (String(note || "").trim()) {
    dispute.moderatorNotes = String(note).trim();
  }

  await dispute.save();

  // Gui thong bao cho hai ben de cap nhat hanh dong tiep theo.
  const isReturn = dispute.reason === 'return_request';
  const buyerMsg = isReturn
    ? 'Yêu cầu hoàn hàng của bạn đang được điều tra. Vui lòng gửi hàng lại cho người bán.'
    : 'Khiếu nại của bạn đang được điều tra. Vui lòng cung cấp thêm bằng chứng nếu có.';
  const sellerMsg = isReturn
    ? 'Người mua yêu cầu hoàn hàng. Chuẩn bị nhận lại hàng và xác nhận khi đã nhận được.'
    : 'Đơn hàng đang bị khiếu nại. Vui lòng cung cấp bằng chứng phản hồi trong hệ thống.';

  await Promise.all([
    pushDisputeNotification(dispute.buyerId, 'Tranh chấp đang điều tra', buyerMsg, disputeId),
    pushDisputeNotification(dispute.sellerId, 'Tranh chấp đang điều tra', sellerMsg, disputeId)
  ]);

  return getDisputeById(disputeId);
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
  resolveReport,
  getOrders,
  getOrderById,
  forceCancelOrder,
  updateOrderStatusByModerator,
  getReviews,
  hideReview,
  markSellerBadByReview,
  markSellerGoodByReview,
  getDisputes,
  getDisputeById,
  resolveDispute,
  markDisputeInvestigating,
  sendDisputeModeratorMessage
};
