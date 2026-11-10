const mongoose = require('mongoose');
const Transaction = require('./transaction.model');
const Wallet = require('./wallet.model');

const REJECTION_STATUSES = ['failed', 'cancelled'];

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

async function requirePendingWithdrawal(withdrawalId, session) {
  const query = mongoose.Types.ObjectId.isValid(withdrawalId) ? Transaction.findById(withdrawalId) : null;
  const withdrawal = query && await (session ? query.session(session) : query);
  if (!withdrawal || withdrawal.type !== 'withdrawal') throw httpError(404, 'Không tìm thấy lệnh rút tiền');
  if (withdrawal.status !== 'pending') throw httpError(400, 'Lệnh rút đã được xử lý');
  return withdrawal;
}

// INV-01: the balance change and its ledger record commit together or not at all.
async function approveWithdrawal(withdrawalId, actorId) {
  const session = await mongoose.startSession();
  try {
    let approved;
    await session.withTransaction(async () => {
      const withdrawal = await requirePendingWithdrawal(withdrawalId, session);
      const wallet = await Wallet.findOne({ userId: withdrawal.userId }).session(session);
      if (!wallet || wallet.balance < withdrawal.amount) throw httpError(400, 'Số dư không đủ');

      const balanceBefore = wallet.balance;
      wallet.balance -= withdrawal.amount;
      wallet.totalWithdrawn += withdrawal.amount;
      await wallet.save({ session });

      withdrawal.status = 'completed';
      withdrawal.completedAt = new Date();
      withdrawal.balanceBefore = balanceBefore;
      withdrawal.balanceAfter = wallet.balance;
      withdrawal.metadata = { ...(withdrawal.metadata || {}), approvedBy: actorId, approvedAt: new Date() };
      await withdrawal.save({ session });
      approved = withdrawal;
    });
    return approved;
  } finally {
    await session.endSession();
  }
}

async function rejectWithdrawal(withdrawalId, actorId, reason, status = 'cancelled') {
  if (!REJECTION_STATUSES.includes(status)) throw httpError(400, 'Trạng thái từ chối không hợp lệ');
  const withdrawal = await requirePendingWithdrawal(withdrawalId);
  const note = String(reason || '').trim() || 'Yêu cầu rút tiền bị từ chối';
  withdrawal.status = status;
  withdrawal[status === 'failed' ? 'failedAt' : 'cancelledAt'] = new Date();
  withdrawal.failureReason = note;
  withdrawal.metadata = { ...(withdrawal.metadata || {}), rejectedBy: actorId, rejectedAt: new Date(), reason: note };
  await withdrawal.save();
  return withdrawal;
}

module.exports = { approveWithdrawal, rejectWithdrawal };
