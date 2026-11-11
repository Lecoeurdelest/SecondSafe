jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return Object.assign(Object.create(actual), { startSession: jest.fn() });
});
jest.mock('../src/modules/payments/transaction.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/payments/wallet.model', () => ({ findOne: jest.fn() }));

const mongoose = require('mongoose');
const Transaction = require('../src/modules/payments/transaction.model');
const Wallet = require('../src/modules/payments/wallet.model');
const service = require('../src/modules/payments/withdrawal.service');

const withdrawalId = '507f1f77bcf86cd799439011';
const adminId = '507f1f77bcf86cd799439012';

function withSession(value) {
  return { session: jest.fn().mockResolvedValue(value), then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) };
}

function pendingWithdrawal(overrides = {}) {
  const withdrawal = { _id: withdrawalId, type: 'withdrawal', status: 'pending', amount: 60000, userId: 'user', metadata: { bankName: 'VCB' }, save: jest.fn(), ...overrides };
  return withdrawal;
}

beforeEach(() => {
  jest.resetAllMocks();
  mongoose.startSession.mockResolvedValue({ withTransaction: jest.fn(async work => work()), endSession: jest.fn() });
});

test('approval debits the wallet and records balances on the same ledger entry (INV-01)', async () => {
  const withdrawal = pendingWithdrawal();
  const wallet = { balance: 100000, totalWithdrawn: 0, save: jest.fn() };
  Transaction.findById.mockReturnValue(withSession(withdrawal));
  Wallet.findOne.mockReturnValue(withSession(wallet));

  const result = await service.approveWithdrawal(withdrawalId, adminId);

  expect(wallet).toMatchObject({ balance: 40000, totalWithdrawn: 60000 });
  expect(result).toMatchObject({ status: 'completed', balanceBefore: 100000, balanceAfter: 40000 });
  expect(result.metadata).toMatchObject({ bankName: 'VCB', approvedBy: adminId });
});

test('approval fails without touching the wallet when the balance is short or the request is settled', async () => {
  const wallet = { balance: 1000, totalWithdrawn: 0, save: jest.fn() };
  Transaction.findById.mockReturnValue(withSession(pendingWithdrawal()));
  Wallet.findOne.mockReturnValue(withSession(wallet));
  await expect(service.approveWithdrawal(withdrawalId, adminId)).rejects.toMatchObject({ statusCode: 400, message: 'Số dư không đủ' });
  expect(wallet.save).not.toHaveBeenCalled();

  Transaction.findById.mockReturnValue(withSession(pendingWithdrawal({ status: 'completed' })));
  await expect(service.approveWithdrawal(withdrawalId, adminId)).rejects.toMatchObject({ statusCode: 400 });
  Transaction.findById.mockReturnValue(withSession(pendingWithdrawal({ type: 'deposit' })));
  await expect(service.approveWithdrawal(withdrawalId, adminId)).rejects.toMatchObject({ statusCode: 404 });
});

test('rejection records who refused and why, and never moves money', async () => {
  const withdrawal = pendingWithdrawal();
  Transaction.findById.mockReturnValue(withSession(withdrawal));

  const result = await service.rejectWithdrawal(withdrawalId, adminId, 'Sai số tài khoản', 'failed');

  expect(result).toMatchObject({ status: 'failed', failureReason: 'Sai số tài khoản' });
  expect(result.failedAt).toBeInstanceOf(Date);
  expect(Wallet.findOne).not.toHaveBeenCalled();
  await expect(service.rejectWithdrawal(withdrawalId, adminId, 'x', 'completed')).rejects.toMatchObject({ statusCode: 400 });
});
