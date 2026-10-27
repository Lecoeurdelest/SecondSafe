jest.mock('../src/modules/users/user.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/products/category.model', () => ({ collection: { name: 'categories' } }));
jest.mock('../src/modules/orders/order.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/orders/purchase-request.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/reports/report.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/reports/dispute.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/payments/transaction.model', () => ({
  aggregate: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../src/modules/payments/wallet.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/reports/review.model', () => ({ aggregate: jest.fn() }));
jest.mock('../src/modules/delivery/delivery.model', () => ({ aggregate: jest.fn() }));

const User = require('../src/modules/users/user.model');
const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const PurchaseRequest = require('../src/modules/orders/purchase-request.model');
const Report = require('../src/modules/reports/report.model');
const Dispute = require('../src/modules/reports/dispute.model');
const Transaction = require('../src/modules/payments/transaction.model');
const Wallet = require('../src/modules/payments/wallet.model');
const Review = require('../src/modules/reports/review.model');
const Delivery = require('../src/modules/delivery/delivery.model');
const { getDashboard, recentMonthSeries } = require('../src/modules/users/admin-dashboard.service');

beforeEach(() => {
  jest.clearAllMocks();
  User.aggregate
    .mockResolvedValueOnce([{ _id: 'admin', count: 1 }, { _id: 'user', count: 4 }])
    .mockResolvedValueOnce([{ _id: 'active', count: 4 }, { _id: 'suspended', count: 1 }]);
  Product.aggregate
    .mockResolvedValueOnce([{ _id: 'active', count: 7 }, { _id: 'sold', count: 2 }])
    .mockResolvedValueOnce([{ category: 'Thời trang', count: 5 }]);
  Order.aggregate
    .mockResolvedValueOnce([{ _id: 'completed', count: 3 }, { _id: 'paid', count: 1 }])
    .mockResolvedValueOnce([{ total: 250000 }])
    .mockResolvedValueOnce([{ _id: '2026-10', count: 2 }]);
  PurchaseRequest.aggregate.mockResolvedValue([{ _id: 'pending', count: 2 }]);
  Report.aggregate.mockResolvedValue([{ _id: 'reviewing', count: 1 }]);
  Dispute.aggregate.mockResolvedValue([{ _id: 'pending', count: 1 }]);
  Transaction.aggregate
    .mockResolvedValueOnce([{ _id: 'fee', count: 4 }, { _id: 'deposit', count: 3 }])
    .mockResolvedValueOnce([{ total: 15000 }]);
  Transaction.countDocuments.mockResolvedValue(1);
  Wallet.aggregate.mockResolvedValue([{ total: 5, balanceVnd: 40000 }]);
  Review.aggregate
    .mockResolvedValueOnce([{ _id: 'active', count: 4 }])
    .mockResolvedValueOnce([{ averageRating: 4.5 }]);
  Delivery.aggregate.mockResolvedValue([{ _id: 'in_transit', count: 2 }]);
});

test('admin dashboard aggregates current MongoDB collections into safe summary metrics', async () => {
  const dashboard = await getDashboard();

  expect(dashboard.users).toEqual({
    total: 5,
    byRole: { admin: 1, user: 4 },
    byStatus: { active: 4, suspended: 1 }
  });
  expect(dashboard.products).toMatchObject({
    total: 9,
    byStatus: { active: 7, sold: 2 },
    byCategory: [{ category: 'Thời trang', count: 5 }]
  });
  expect(dashboard.orders).toMatchObject({
    total: 4,
    byStatus: { completed: 3, paid: 1 },
    valueVnd: 250000
  });
  expect(dashboard.transactions.feeRevenueVnd).toBe(15000);
  expect(dashboard.wallets).toEqual({ total: 5, balanceVnd: 40000 });
  expect(dashboard.pendingWithdrawals).toBe(1);
  expect(dashboard.generatedAt).toBeInstanceOf(Date);
  expect(JSON.stringify(dashboard)).not.toContain('password');
});

test('monthly series contains six months and fills missing months with zero', () => {
  const months = recentMonthSeries([{ _id: '2026-10', count: 3 }], new Date('2026-10-27T00:00:00Z'));
  expect(months).toHaveLength(6);
  expect(months[5].count).toBe(3);
  expect(months.slice(0, 5).every(month => month.count === 0)).toBe(true);
});
