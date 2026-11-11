jest.mock('../src/modules/reports/report.model', () => ({ findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() }));
jest.mock('../src/modules/reports/dispute.model', () => ({ findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/reports/review.model', () => ({ findById: jest.fn(), find: jest.fn(), updateMany: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/orders/order.model', () => ({ findById: jest.fn(), find: jest.fn(), aggregate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ findById: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn(), find: jest.fn() }));
jest.mock('../src/modules/payments/escrow-hold.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/payments/transaction.model', () => ({ find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/payments/escrow.service', () => ({ releaseFunds: jest.fn(), refundFunds: jest.fn() }));
jest.mock('../src/modules/orders/order.service', () => ({ forceCancelOrder: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/common/utils/seller-restriction.util', () => ({ applySellingRestrictionToUser: jest.fn() }));

const Order = require('../src/modules/orders/order.model');
const business = require('../src/config/business');
const moderatorService = require('../src/modules/moderator/moderator.service');

function chain(value) {
  const query = { lean: jest.fn().mockResolvedValue(value) };
  for (const method of ['sort', 'limit', 'select', 'populate']) query[method] = jest.fn(() => query);
  return query;
}

beforeEach(() => {
  jest.resetAllMocks();
  Order.find.mockReturnValue(chain([]));
  Order.aggregate.mockResolvedValue([]);
});

afterEach(() => jest.useRealTimers());

test('the report covers completed orders in the requested range, grouped by month (AC-MOD-08-1)', async () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const to = new Date('2026-03-31T23:59:59Z');
  Order.aggregate
    .mockResolvedValueOnce([{ completedOrders: 3, grossRevenue: 600000, platformRevenue: 30000 }])
    .mockResolvedValueOnce([
      { _id: { year: 2026, month: 1 }, completedOrders: 1, grossRevenue: 200000, platformRevenue: 10000 },
      { _id: { year: 2026, month: 3 }, completedOrders: 2, grossRevenue: 400000, platformRevenue: 20000 }
    ])
    .mockResolvedValueOnce([{ _id: 'product-1', title: undefined, completedOrders: 3, grossRevenue: 600000, platformRevenue: 30000 }]);

  const report = await moderatorService.getRevenueReport({ from, to });

  const match = { status: 'completed', completedAt: { $gte: from, $lte: to } };
  for (const [pipeline] of Order.aggregate.mock.calls) expect(pipeline[0]).toEqual({ $match: match });
  expect(Order.aggregate.mock.calls[1][0][1].$group._id).toEqual({ year: { $year: '$completedAt' }, month: { $month: '$completedAt' } });
  expect(report.range).toEqual({ from, to });
  expect(report.summary).toEqual({ completedOrders: 3, grossRevenue: 600000, platformRevenue: 30000, sellerPayout: 570000 });
  expect(report.breakdown.map(row => row.period)).toEqual(['2026-01', '2026-03']);
  expect(report.breakdown[1]).toMatchObject({ grossRevenue: 400000, sellerPayout: 380000 });
  expect(report.topProducts[0]).toMatchObject({ productId: 'product-1', title: 'Sản phẩm đã xóa' });
});

test('the default range is the last twelve calendar months', async () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 10, 9, 0, 0));

  const report = await moderatorService.getRevenueReport();

  expect(report.range.from).toEqual(new Date(2025, 11, 1));
  expect(report.range.to).toEqual(new Date(2026, 10, 30, 23, 59, 59, 999));
  expect(report.summary).toEqual({ completedOrders: 0, grossRevenue: 0, platformRevenue: 0, sellerPayout: 0 });
});

test('fees come from the stored order fee, or from the configured rate when none was stored (AC-ORD-12-2)', async () => {
  Order.find.mockReturnValue(chain([
    { _id: 'with-fee', totalToPay: 200000, platformFee: 7000 },
    { _id: 'without-fee', totalToPay: 200001 }
  ]));

  const report = await moderatorService.getRevenueReport();

  const feeExpression = Order.aggregate.mock.calls[0][0][1].$group.platformRevenue.$sum;
  expect(feeExpression.$cond[2]).toEqual({ $round: [{ $multiply: [{ $ifNull: ['$totalToPay', 0] }, business.feeRate] }, 0] });
  expect(report.rule.platformFeeRate).toBe(business.feeRate);
  expect(report.recentOrders[0]).toMatchObject({ platformRevenue: 7000, sellerPayout: 193000 });
  expect(report.recentOrders[1]).toMatchObject({ platformRevenue: Math.round(200001 * business.feeRate) });
  expect(Number.isInteger(report.recentOrders[1].platformRevenue)).toBe(true);
});

test('an invalid date range is rejected', async () => {
  await expect(moderatorService.getRevenueReport({ from: 'not-a-date' })).rejects.toThrow('Khoảng thời gian không hợp lệ');
});
