const crypto = require('node:crypto');
const { SePayPgClient } = require('sepay-pg-node');
const walletService = require('./wallet.service');
const Transaction = require('./transaction.model');
const logger = require('../../common/utils/logger.util');

// SePay Payment Gateway Service
// Uses the official sepay-pg-node SDK for correct signature generation

function getSePayClient() {
  const env = process.env.SEPAY_ENV || 'sandbox';
  const merchantId = process.env.SEPAY_MERCHANT_ID;
  const secretKey = process.env.SEPAY_SECRET_KEY;
  if (!merchantId || !secretKey) throw new Error('Missing SEPAY_MERCHANT_ID or SEPAY_SECRET_KEY in .env');
  return new SePayPgClient({ env, merchant_id: merchantId, secret_key: secretKey });
}

async function createSePayPayment(userId, amount, orderInfo) {
  orderInfo = orderInfo || 'Nap tien vao vi';
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) throw new Error('So tien khong hop le');
  if (!Number.isInteger(normalizedAmount)) throw new Error('So tien nap phai la so nguyen VND');
  if (normalizedAmount < 10000) throw new Error('So tien nap toi thieu la 10,000 VND');
  if (normalizedAmount > 500000000) throw new Error('So tien nap toi da la 500,000,000 VND');
  const transaction = await walletService.createTransaction(userId, {
    type: 'deposit', amount: normalizedAmount, status: 'pending',
    description: orderInfo, paymentMethod: 'sepay',
  });
  const client = getSePayClient();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inv = transaction._id.toString();
  const checkoutUrl = client.checkout.initCheckoutUrl();
  const fields = client.checkout.initOneTimePaymentFields({
    operation: 'PURCHASE',
    payment_method: 'BANK_TRANSFER',
    order_invoice_number: inv,
    order_amount: normalizedAmount,
    currency: 'VND',
    order_description: orderInfo,
    customer_id: userId.toString(),
    success_url: frontendUrl + '/wallet/topup-success?transactionId=' + inv,
    error_url: frontendUrl + '/wallet/topup-result?success=false&message=Loi',
    cancel_url: frontendUrl + '/wallet/topup-result?success=false&message=Huy',
  });
  return { checkoutUrl, fields, transactionId: inv };
}

async function createSePayOrderPayment(userId, orderId, amount, orderInfo) {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) throw new Error('So tien khong hop le');
  const transaction = await walletService.createTransaction(userId, {
    type: 'payment', orderId: orderId, amount: normalizedAmount,
    status: 'pending', description: orderInfo, paymentMethod: 'sepay',
  });
  const client = getSePayClient();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inv = transaction._id.toString();
  const checkoutUrl = client.checkout.initCheckoutUrl();
  const fields = client.checkout.initOneTimePaymentFields({
    operation: 'PURCHASE',
    payment_method: 'BANK_TRANSFER',
    order_invoice_number: inv,
    order_amount: normalizedAmount,
    currency: 'VND',
    order_description: orderInfo || 'Thanh toan don hang',
    customer_id: userId.toString(),
    success_url: frontendUrl + '/orders',
    error_url: frontendUrl + '/orders/sepay-result?success=false&message=Loi',
    cancel_url: frontendUrl + '/orders/sepay-result?success=false&message=Huy',
  });
  return { checkoutUrl, fields, transactionId: inv };
}

const IPN_CLAIM_TTL_MS = 2 * 60 * 1000;

function secretsMatch(received, expected) {
  const given = Buffer.from(String(received || '').trim());
  const wanted = Buffer.from(String(expected || '').trim());
  return wanted.length > 0 && given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

// The claim is atomic, so a repeated or parallel notification can never credit the same payment twice.
// A claim older than the TTL belongs to a run that died mid-way and may be taken over.
function claimPendingTransaction(id, now = new Date()) {
  return Transaction.findOneAndUpdate(
    {
      _id: id,
      status: 'pending',
      $or: [
        { 'metadata.ipnClaimedAt': { $exists: false } },
        { 'metadata.ipnClaimedAt': { $lt: new Date(now.getTime() - IPN_CLAIM_TTL_MS) } }
      ]
    },
    { $set: { 'metadata.ipnClaimedAt': now } },
    { new: true }
  );
}

async function describeUnclaimedTransaction(id) {
  const current = await Transaction.findById(id);
  if (current && current.status === 'completed') return { success: true, message: 'Already processed' };
  if (current && current.status === 'pending') return { success: true, message: 'Already being processed' };
  return { success: false, message: 'Transaction is not payable' };
}

async function creditPaidTransaction(tx, paidAmount, providerTransactionId) {
  const reference = providerTransactionId || String(tx._id);
  if (tx.type === 'deposit') {
    await walletService.incrementBalance(tx.userId, paidAmount, 'deposit',
      'Nap tien qua SePay - ' + reference, { transactionId: tx._id });
  } else if (tx.type === 'payment' && tx.orderId) {
    await walletService.incrementBalance(tx.userId, paidAmount, 'deposit',
      'Nap tu dong cho don hang - ' + reference);
    const orderService = require('../orders/order.service');
    await orderService.payOrder(tx.orderId, tx.userId);
  }
}

async function settleClaimedTransaction(tx, paidAmount, providerTransactionId) {
  try {
    await creditPaidTransaction(tx, paidAmount, providerTransactionId);
    tx.status = 'completed';
    tx.completedAt = new Date();
    await tx.save();
    logger.info('SePay IPN processed', { transactionId: String(tx._id), type: tx.type, amount: paidAmount });
    return { success: true, message: 'Payment processed' };
  } catch (err) {
    logger.error('SePay IPN processing failed', { transactionId: String(tx._id), error: err.message });
    tx.status = 'failed';
    tx.failedAt = new Date();
    tx.failureReason = err.message;
    await tx.save();
    return { success: false, message: 'Error processing payment' };
  }
}

function parsePaidNotification(body) {
  if (!body || body.notification_type !== 'ORDER_PAID') return { result: { success: true, message: 'Event ignored' } };
  const order = body.order || {};
  if (!order.order_invoice_number) return { result: { success: false, message: 'Missing order_invoice_number' } };
  const amount = Number(order.order_amount);
  if (!Number.isFinite(amount) || amount <= 0) return { result: { success: false, message: 'Invalid amount' } };
  return {
    invoice: order.order_invoice_number,
    amount,
    providerTransactionId: body.transaction && body.transaction.transaction_id
  };
}

async function failAmountMismatch(tx) {
  tx.status = 'failed';
  tx.failedAt = new Date();
  tx.failureReason = 'Amount mismatch';
  await tx.save();
  return { success: false, message: 'Amount mismatch' };
}

async function handleSePayIPN(body, receivedSecretKey) {
  if (!secretsMatch(receivedSecretKey, process.env.SEPAY_SECRET_KEY)) {
    logger.warn('SePay IPN rejected: secret key mismatch');
    return { success: false, message: 'Unauthorized', statusCode: 401 };
  }
  const paid = parsePaidNotification(body);
  if (paid.result) return paid.result;
  const pendingTx = await Transaction.findById(paid.invoice);
  if (!pendingTx) return { success: false, message: 'Transaction not found' };
  if (pendingTx.status === 'completed') return { success: true, message: 'Already processed' };
  if (paid.amount !== Number(pendingTx.amount)) return failAmountMismatch(pendingTx);
  const claimed = await claimPendingTransaction(pendingTx._id);
  if (!claimed) return describeUnclaimedTransaction(pendingTx._id);
  return settleClaimedTransaction(claimed, paid.amount, paid.providerTransactionId);
}

async function handleSePayOrderReturn(transactionId) {
  if (!transactionId) return { success: false, message: 'Khong co ma giao dich' };
  const tx = await Transaction.findById(transactionId);
  if (!tx) return { success: false, message: 'Khong tim thay giao dich' };
  if (tx.status === 'completed') return { success: true, message: 'Thanh toan don hang thanh cong', amount: tx.amount, orderId: tx.orderId, transactionId: tx._id, status: 'completed' };
  return { success: tx.status !== 'failed', message: tx.status === 'pending' ? 'Dang xu ly.' : 'That bai', amount: tx.amount, orderId: tx.orderId, transactionId: tx._id, status: tx.status };
}

async function handleSePayReturn(transactionId) {
  if (!transactionId) return { success: false, message: 'Khong co ma giao dich' };
  const tx = await Transaction.findById(transactionId);
  if (!tx) return { success: false, message: 'Khong tim thay giao dich' };
  if (tx.status === 'completed') return { success: true, message: 'Nap tien thanh cong', amount: tx.amount, transactionId: tx._id, status: 'completed' };
  return { success: tx.status !== 'failed', message: tx.status === 'pending' ? 'Dang xu ly.' : 'That bai', amount: tx.amount, transactionId: tx._id, status: tx.status };
}

module.exports = { createSePayPayment, createSePayOrderPayment, handleSePayIPN, handleSePayReturn, handleSePayOrderReturn };
