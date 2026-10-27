jest.mock('../src/modules/users/user.model', () => ({
  aggregate: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../src/modules/orders/order.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/orders/purchase-request.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/reports/report.model', () => ({ aggregate: jest.fn(), find: jest.fn() }));
jest.mock('../src/modules/reports/dispute.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/payments/transaction.model', () => ({ aggregate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/reports/review.model', () => ({ aggregate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/delivery/delivery.model', () => ({ aggregate: jest.fn() }));

const User = require('../src/modules/users/user.model');
const Order = require('../src/modules/orders/order.model');
const PurchaseRequest = require('../src/modules/orders/purchase-request.model');
const Report = require('../src/modules/reports/report.model');
const Dispute = require('../src/modules/reports/dispute.model');
const Transaction = require('../src/modules/payments/transaction.model');
const Review = require('../src/modules/reports/review.model');
const Delivery = require('../src/modules/delivery/delivery.model');
const { getDashboard } = require('../src/modules/moderator/moderator.dashboard.service');

beforeEach(() => {
  jest.clearAllMocks();
  PurchaseRequest.aggregate.mockResolvedValue([{ _id: 'pending', count: 2 }]);
  Report.aggregate.mockResolvedValue([{ _id: 'pending', count: 1 }, { _id: 'reviewing', count: 2 }]);
  Dispute.aggregate.mockResolvedValue([{ _id: 'pending', count: 1 }, { _id: 'investigating', count: 2 }]);
  Order.aggregate.mockResolvedValue([
    { _id: 'paid', count: 2 },
    { _id: 'completed', count: 3 },
    { _id: 'cancelled', count: 1 }
  ]);
  Delivery.aggregate.mockResolvedValue([{ _id: 'pending', count: 1 }, { _id: 'in_transit', count: 2 }]);
  User.countDocuments.mockResolvedValue(1);
  Transaction.countDocuments.mockResolvedValue(1);
  Review.countDocuments.mockResolvedValue(4);
  Report.find.mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([{
      _id: 'report-id',
      reportType: 'product',
      reason: 'scam',
      status: 'pending',
      createdAt: new Date('2026-10-27T00:00:00Z'),
      description: 'private report details',
      reporterEmail: 'private@example.test'
    }])
  });
});

test('staff dashboard queries live workload and returns only safe report summaries', async () => {
  const dashboard = await getDashboard();

  expect(dashboard).toMatchObject({
    pendingReports: 1,
    reviewingReports: 2,
    pendingWithdrawals: 1,
    unreviewedReviews: 4,
    suspendedUsers: 1,
    pendingPurchaseRequests: 2,
    openOrders: 2,
    openDisputes: 3,
    activeDeliveries: 3
  });
  expect(dashboard.latestReports[0]).toEqual({
    id: 'report-id',
    reportType: 'product',
    reason: 'scam',
    status: 'pending',
    createdAt: new Date('2026-10-27T00:00:00Z')
  });
  expect(JSON.stringify(dashboard)).not.toContain('private');
  expect(dashboard).not.toHaveProperty('wallets');
  expect(dashboard).not.toHaveProperty('transactions');
});
