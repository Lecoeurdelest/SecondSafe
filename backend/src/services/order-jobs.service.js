const Order = require('../modules/orders/order.model');
const Product = require('../modules/products/product.model');
const Dispute = require('../modules/reports/dispute.model');
const escrowService = require('../modules/payments/escrow.service');
const { createNotification } = require('../modules/notifications/notification.service');
const business = require('../config/business');
const logger = require('../common/utils/logger.util');

const BATCH_SIZE = 200;

// One failing order must not block the rest of the batch.
async function forEachSafely(items, label, action) {
  let done = 0;
  for (const item of items) {
    try {
      await action(item);
      done += 1;
    } catch (error) {
      logger.error(`${label} failed`, { id: String(item._id), error: error.message });
    }
  }
  return done;
}

async function notifySeller(order) {
  try {
    await createNotification(order.sellerId, {
      type: 'system',
      orderId: order._id,
      title: 'Đơn hàng đã hủy do quá hạn thanh toán',
      message: 'Người mua chưa thanh toán đúng hạn. Tin đăng của bạn đã được mở bán lại.'
    });
  } catch (error) {
    logger.error('Payment timeout notification failed', { error: error.message });
  }
}

// The status filter makes the cancellation safe against a payment that lands at the same moment.
async function cancelUnpaidOrder(order, now) {
  const cancelled = await Order.findOneAndUpdate(
    { _id: order._id, status: 'awaiting_payment' },
    { $set: { status: 'cancelled', cancelledAt: now, cancellationReason: 'Hết thời gian thanh toán' } },
    { new: true }
  );
  if (!cancelled) return;
  await Product.updateOne({ _id: cancelled.productId, status: 'pending' }, { $set: { status: 'active' } });
  await notifySeller(cancelled);
}

async function cancelUnpaidOrders(now = new Date()) {
  const orders = await Order.find({ status: 'awaiting_payment', paymentDeadline: { $lt: now } }).limit(BATCH_SIZE);
  return forEachSafely(orders, 'Payment timeout', order => cancelUnpaidOrder(order, now));
}

// AC-SYS-02-1: delivered orders past the configured window complete, unless a dispute exists for them.
async function completeDeliveredOrders(now = new Date()) {
  const orders = await Order.find({
    status: 'delivered',
    deliveredAt: { $lte: new Date(now.getTime() - business.autoCompletionWindowMs) }
  }).limit(BATCH_SIZE);
  if (!orders.length) return 0;
  const disputed = new Set((await Dispute.distinct('orderId', { orderId: { $in: orders.map(order => order._id) } })).map(String));
  const undisputed = orders.filter(order => !disputed.has(String(order._id)));
  return forEachSafely(undisputed, 'Automatic completion', order => escrowService.releaseFunds(
    order._id, 'Tự động hoàn thành sau thời hạn xác nhận nhận hàng', true
  ));
}

async function refundUnshippedOrders(now = new Date()) {
  const orders = await Order.find({
    status: 'paid',
    paidAt: { $lte: new Date(now.getTime() - business.shippingWindowMs) }
  }).limit(BATCH_SIZE);
  return forEachSafely(orders, 'Late shipping refund', order => escrowService.refundFunds(
    order._id, 'Hủy tự động: Người bán không giao hàng đúng hạn'
  ));
}

module.exports = { cancelUnpaidOrders, completeDeliveredOrders, refundUnshippedOrders };
