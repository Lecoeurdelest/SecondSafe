jest.mock('../src/modules/reports/report.model', () => ({ findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() }));
jest.mock('../src/modules/reports/dispute.model', () => ({ findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/reports/review.model', () => ({ findById: jest.fn(), find: jest.fn(), updateMany: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/orders/order.model', () => ({ findById: jest.fn(), find: jest.fn(), aggregate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ findById: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn(), find: jest.fn() }));
jest.mock('../src/modules/payments/escrow-hold.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/payments/transaction.model', () => ({ find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/payments/escrow.service', () => ({ releaseFunds: jest.fn(), refundFunds: jest.fn() }));
jest.mock('../src/modules/payments/withdrawal.service', () => ({ approveWithdrawal: jest.fn(), rejectWithdrawal: jest.fn() }));
jest.mock('../src/modules/orders/order.service', () => ({ forceCancelOrder: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/common/utils/seller-restriction.util', () => ({ applySellingRestrictionToUser: jest.fn() }));

const Transaction = require('../src/modules/payments/transaction.model');
const withdrawalService = require('../src/modules/payments/withdrawal.service');
const moderatorService = require('../src/modules/moderator/moderator.service');

const moderatorId = '507f1f77bcf86cd799439011';

beforeEach(() => jest.resetAllMocks());

test('staff list withdrawal requests by status with pagination', async () => {
  const query = { lean: jest.fn().mockResolvedValue([{ _id: 'w1' }]) };
  for (const method of ['sort', 'skip', 'limit', 'populate']) query[method] = jest.fn(() => query);
  Transaction.find.mockReturnValue(query);
  Transaction.countDocuments.mockResolvedValue(1);

  const result = await moderatorService.getWithdrawals({ status: 'pending' }, { page: 1, limit: 20 });

  expect(Transaction.find).toHaveBeenCalledWith({ type: 'withdrawal', status: 'pending' });
  expect(result).toMatchObject({ withdrawals: [{ _id: 'w1' }], pagination: { total: 1 } });
});

test('moderator decisions use the single approval flow (AC-PAY-06-1)', async () => {
  await moderatorService.updateWithdrawalStatus('w1', 'completed', '', moderatorId);
  expect(withdrawalService.approveWithdrawal).toHaveBeenCalledWith('w1', moderatorId);

  await moderatorService.updateWithdrawalStatus('w1', 'failed', 'Sai số tài khoản', moderatorId);
  expect(withdrawalService.rejectWithdrawal).toHaveBeenCalledWith('w1', moderatorId, 'Sai số tài khoản', 'failed');

  await moderatorService.updateWithdrawalStatus('w1', 'cancelled', 'Người dùng yêu cầu', moderatorId);
  expect(withdrawalService.rejectWithdrawal).toHaveBeenLastCalledWith('w1', moderatorId, 'Người dùng yêu cầu', 'cancelled');
});
