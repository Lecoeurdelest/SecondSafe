const mongoose = require('mongoose');
const AbandonedCheckout = require('./abandoned-checkout.model');
const Order = require('./order.model');
const CartItem = require('../users/cart-item.model');
const Product = require('../products/product.model');
const { getEligibleProductIds } = require('../products/product-availability.service');
const { createNotification } = require('../notifications/notification.service');
const business = require('../../config/business');
const logger = require('../../common/utils/logger.util');
const { pagination } = require('../../common/utils/pagination.util');

const PURCHASED_STATUSES = ['paid', 'shipped', 'delivered', 'completed', 'disputed'];
const ACTIVE_STATUSES = ['at_risk', 'open'];
const BATCH_SIZE = 200;

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

// A reminder that cannot be delivered must not stop the job or the order update it follows.
async function notify(recipientId, payload) {
  try {
    await createNotification(recipientId, { type: 'system', ...payload });
  } catch (error) {
    logger.error('Abandoned checkout notification failed', { error: error.message });
  }
}

function orderAmount(order) {
  return Math.round(Number(order.totalToPay ?? order.agreedAmount ?? 0));
}

async function productTitle(productId) {
  const product = await Product.findById(productId).select('title').lean();
  return product?.title ? `"${product.title}"` : 'của bạn';
}

// Reminds each buyer once while the order can still be paid.
async function remindExpiringPayments(now = new Date()) {
  const orders = await Order.find({
    status: 'awaiting_payment',
    paymentDeadline: { $gt: now, $lte: new Date(now.getTime() + business.checkoutReminderLeadMs) }
  }).limit(BATCH_SIZE).lean();

  let reminded = 0;
  for (const order of orders) {
    const created = await AbandonedCheckout.updateOne(
      { orderId: order._id },
      {
        $setOnInsert: {
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          productId: order.productId,
          orderId: order._id,
          source: 'order',
          status: 'at_risk',
          amount: orderAmount(order),
          remindedAt: now,
          reminderCount: 1,
          expiresAt: order.paymentDeadline
        }
      },
      { upsert: true }
    );
    if (!created.upsertedCount) continue;
    reminded += 1;
    await notify(order.buyerId, {
      orderId: order._id,
      title: 'Đơn hàng sắp hết hạn thanh toán',
      message: `Đơn hàng ${await productTitle(order.productId)} sẽ tự hủy nếu bạn chưa thanh toán trước ${new Date(order.paymentDeadline).toLocaleTimeString('vi-VN')}.`
    });
  }
  return reminded;
}

// Called after the payment-timeout job cancels an unpaid order.
async function recordAbandonedOrder(order, now = new Date()) {
  await AbandonedCheckout.updateOne(
    { orderId: order._id },
    {
      $set: { status: 'open', abandonedAt: now, expiresAt: new Date(now.getTime() + business.abandonedCheckoutTtlMs) },
      $setOnInsert: {
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        productId: order.productId,
        orderId: order._id,
        source: 'order',
        amount: orderAmount(order)
      }
    },
    { upsert: true }
  );
  await notify(order.buyerId, {
    productId: order.productId,
    title: 'Thanh toán chưa hoàn tất',
    message: `Đơn hàng ${await productTitle(order.productId)} đã hủy vì quá hạn thanh toán. Sản phẩm vẫn còn, bạn có thể đặt mua lại.`
  });
}

async function alreadyTracked(item) {
  return AbandonedCheckout.exists({
    buyerId: item.user,
    productId: item.product,
    source: 'cart',
    createdAt: { $gte: item.createdAt }
  });
}

// Reminds a buyer once per cart item that has waited longer than the configured age.
async function detectAbandonedCarts(now = new Date()) {
  const availableIds = await getEligibleProductIds();
  if (!availableIds.length) return 0;
  const items = await CartItem.find({
    product: { $in: availableIds },
    createdAt: { $lte: new Date(now.getTime() - business.cartAbandonAfterMs) }
  }).sort({ createdAt: 1 }).limit(BATCH_SIZE).populate('product', 'title price seller').lean();

  let detected = 0;
  for (const item of items) {
    if (!item.product || await alreadyTracked(item)) continue;
    await AbandonedCheckout.create({
      buyerId: item.user,
      sellerId: item.product.seller,
      productId: item.product._id,
      source: 'cart',
      status: 'open',
      amount: Math.round(Number(item.product.price || 0)),
      abandonedAt: now,
      remindedAt: now,
      reminderCount: 1,
      expiresAt: new Date(now.getTime() + business.abandonedCheckoutTtlMs)
    });
    detected += 1;
    await notify(item.user, {
      productId: item.product._id,
      title: 'Sản phẩm trong giỏ hàng đang chờ bạn',
      message: `"${item.product.title}" vẫn còn trong giỏ hàng. Hoàn tất mua trước khi có người khác đặt.`
    });
  }
  return detected;
}

async function purchaseAfter(checkout) {
  return Order.findOne({
    buyerId: checkout.buyerId,
    productId: checkout.productId,
    status: { $in: PURCHASED_STATUSES },
    createdAt: { $gte: checkout.abandonedAt || checkout.createdAt }
  }).select('_id').lean();
}

async function offerGone(checkout, now, availableIds) {
  if (checkout.expiresAt && checkout.expiresAt <= now) return true;
  if (!availableIds.has(String(checkout.productId))) return true;
  // Removing the item from the cart withdraws the buyer's interest.
  return checkout.source === 'cart' && !(await CartItem.exists({ user: checkout.buyerId, product: checkout.productId }));
}

async function nextState(checkout, now, availableIds) {
  if (checkout.status === 'at_risk') {
    const order = await Order.findById(checkout.orderId).select('status').lean();
    if (order && PURCHASED_STATUSES.includes(order.status)) return { status: 'recovered', recoveredOrderId: order._id };
    // The payment-timeout job moves a cancelled order to open; anything else no longer needs tracking.
    return order?.status === 'awaiting_payment' ? null : { status: 'expired' };
  }
  const purchase = await purchaseAfter(checkout);
  if (purchase) return { status: 'recovered', recoveredOrderId: purchase._id };
  return await offerGone(checkout, now, availableIds) ? { status: 'expired' } : null;
}

// Closes tracked checkouts that were paid for, or whose offer can no longer be taken up.
async function reconcile(now = new Date()) {
  const checkouts = await AbandonedCheckout.find({ status: { $in: ACTIVE_STATUSES } })
    .sort({ updatedAt: 1 }).limit(BATCH_SIZE).lean();
  if (!checkouts.length) return { recovered: 0, expired: 0 };

  const availableIds = new Set((await getEligibleProductIds()).map(String));
  const result = { recovered: 0, expired: 0 };
  for (const checkout of checkouts) {
    const change = await nextState(checkout, now, availableIds);
    if (!change) continue;
    if (change.status === 'recovered') change.recoveredAt = now;
    await AbandonedCheckout.updateOne({ _id: checkout._id, status: checkout.status }, { $set: change });
    result[change.status] += 1;
  }
  return result;
}

function toClient(checkout) {
  const order = checkout.orderId;
  const payable = checkout.status === 'at_risk' && order?.status === 'awaiting_payment';
  return {
    _id: checkout._id,
    source: checkout.source,
    status: checkout.status,
    amount: checkout.amount,
    product: checkout.productId,
    orderId: order?._id || null,
    paymentDeadline: payable ? order.paymentDeadline : null,
    action: payable ? 'resume_payment' : 'buy_again',
    abandonedAt: checkout.abandonedAt || checkout.createdAt,
    expiresAt: checkout.expiresAt
  };
}

// INV-05: a buyer only ever sees their own unfinished checkouts.
async function listForBuyer(buyerId) {
  const checkouts = await AbandonedCheckout.find({ buyerId, status: { $in: ACTIVE_STATUSES } })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('productId', 'title price images status')
    .populate('orderId', 'status paymentDeadline')
    .lean();
  return checkouts.filter(checkout => checkout.productId).map(toClient);
}

async function dismiss(buyerId, checkoutId) {
  if (!mongoose.Types.ObjectId.isValid(checkoutId)) throw httpError(404, 'Không tìm thấy thanh toán dang dở');
  const checkout = await AbandonedCheckout.findOneAndUpdate(
    { _id: checkoutId, buyerId, status: { $in: ACTIVE_STATUSES } },
    { $set: { status: 'dismissed' } },
    { new: true }
  ).lean();
  if (!checkout) throw httpError(404, 'Không tìm thấy thanh toán dang dở');
  return { _id: checkout._id, status: checkout.status };
}

function parseDate(value, name) {
  if (value === undefined || value === '') return null;
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) throw httpError(400, `Tham số ${name} không hợp lệ`);
  return date;
}

function summarize(rows) {
  const totals = { total: 0, recovered: 0, lost: 0, active: 0, recoveredAmount: 0, lostAmount: 0, activeAmount: 0 };
  const bucket = { recovered: 'recovered', dismissed: 'lost', expired: 'lost', at_risk: 'active', open: 'active' };
  for (const row of rows) {
    const key = bucket[row._id.status];
    totals.total += row.count;
    totals[key] += row.count;
    totals[`${key}Amount`] += row.amount;
  }
  const closed = totals.recovered + totals.lost;
  return { ...totals, recoveryRate: closed ? Math.round((totals.recovered / closed) * 1000) / 10 : 0 };
}

async function getSummary(query = {}) {
  const from = parseDate(query.from, 'from');
  const to = parseDate(query.to, 'to');
  if (from && to && from > to) throw httpError(400, 'Khoảng thời gian không hợp lệ');
  const match = {};
  if (from || to) match.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const rows = await AbandonedCheckout.aggregate([
    { $match: match },
    { $group: { _id: { status: '$status', source: '$source' }, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
  ]);
  return {
    ...summarize(rows),
    bySource: {
      order: summarize(rows.filter(row => row._id.source === 'order')),
      cart: summarize(rows.filter(row => row._id.source === 'cart'))
    }
  };
}

async function listForStaff(query = {}) {
  const { page, limit, skip } = pagination(query);
  const filter = {};
  if (AbandonedCheckout.STATUSES.includes(query.status)) filter.status = query.status;
  if (AbandonedCheckout.SOURCES.includes(query.source)) filter.source = query.source;
  const [checkouts, total] = await Promise.all([
    AbandonedCheckout.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyerId', 'fullName email')
      .populate('productId', 'title price images')
      .lean(),
    AbandonedCheckout.countDocuments(filter)
  ]);
  return { checkouts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = {
  remindExpiringPayments,
  recordAbandonedOrder,
  detectAbandonedCarts,
  reconcile,
  listForBuyer,
  dismiss,
  getSummary,
  listForStaff
};
