const mongoose = require("mongoose");
const Order = require("../orders/order.model");
const business = require("../../config/business");

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

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

module.exports = {
  isValidObjectId,
  getRevenueReport
};
