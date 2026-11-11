jest.mock('../src/modules/orders/order.model', () => ({ find: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ updateOne: jest.fn() }));
jest.mock('../src/modules/reports/dispute.model', () => ({ distinct: jest.fn() }));
jest.mock('../src/modules/payments/escrow.service', () => ({ releaseFunds: jest.fn(), refundFunds: jest.fn() }));
jest.mock('../src/modules/orders/abandoned-checkout.service', () => ({ recordAbandonedOrder: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));

const Order = require('../src/modules/orders/order.model');
const Product = require('../src/modules/products/product.model');
const Dispute = require('../src/modules/reports/dispute.model');
const escrowService = require('../src/modules/payments/escrow.service');
const abandonedCheckoutService = require('../src/modules/orders/abandoned-checkout.service');
const { createNotification } = require('../src/modules/notifications/notification.service');
const logger = require('../src/common/utils/logger.util');
const business = require('../src/config/business');
const jobs = require('../src/services/order-jobs.service');

const now = new Date('2026-11-10T10:00:00Z');
const limited = orders => ({ limit: jest.fn().mockResolvedValue(orders) });

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(logger, 'error').mockImplementation(() => {});
});

test('an unpaid order past its deadline is cancelled, its listing reopened and the checkout recorded as abandoned (AC-SYS-01-1)', async () => {
  const order = { _id: 'order-1', productId: 'product-1', buyerId: 'buyer', sellerId: 'seller' };
  Order.find.mockReturnValue(limited([order]));
  Order.findOneAndUpdate.mockResolvedValue({ ...order, status: 'cancelled' });

  expect(await jobs.cancelUnpaidOrders(now)).toBe(1);

  expect(Order.find).toHaveBeenCalledWith({ status: 'awaiting_payment', paymentDeadline: { $lt: now } });
  expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: 'order-1', status: 'awaiting_payment' },
    { $set: expect.objectContaining({ status: 'cancelled', cancelledAt: now }) },
    { new: true }
  );
  expect(Product.updateOne).toHaveBeenCalledWith({ _id: 'product-1', status: 'pending' }, { $set: { status: 'active' } });
  expect(abandonedCheckoutService.recordAbandonedOrder).toHaveBeenCalledWith(expect.objectContaining({ _id: 'order-1' }), now);
  expect(createNotification).toHaveBeenCalledWith('seller', expect.objectContaining({ orderId: 'order-1' }));
});

test('an order paid while the job runs is left alone', async () => {
  Order.find.mockReturnValue(limited([{ _id: 'order-1', productId: 'product-1' }]));
  Order.findOneAndUpdate.mockResolvedValue(null);

  await jobs.cancelUnpaidOrders(now);

  expect(Product.updateOne).not.toHaveBeenCalled();
  expect(abandonedCheckoutService.recordAbandonedOrder).not.toHaveBeenCalled();
});

test('delivered, undisputed orders past the configured window are completed through escrow; one failure does not stop the batch (AC-SYS-02-1, AC-NFR-REL-03-1)', async () => {
  Order.find.mockReturnValue(limited([{ _id: 'a' }, { _id: 'b' }, { _id: 'disputed' }]));
  Dispute.distinct.mockResolvedValue(['disputed']);
  escrowService.releaseFunds.mockRejectedValueOnce(new Error('Tiền ký quỹ đã được xử lý rồi')).mockResolvedValueOnce({});

  expect(await jobs.completeDeliveredOrders(now)).toBe(1);

  expect(Order.find).toHaveBeenCalledWith({
    status: 'delivered',
    deliveredAt: { $lte: new Date(now.getTime() - business.autoCompletionWindowMs) }
  });
  expect(escrowService.releaseFunds).toHaveBeenCalledTimes(2);
  expect(escrowService.releaseFunds).toHaveBeenCalledWith('b', expect.any(String), true);
  expect(logger.error).toHaveBeenCalledWith('Automatic completion failed', { id: 'a', error: 'Tiền ký quỹ đã được xử lý rồi' });
});

test('nothing is released when no delivered order is old enough', async () => {
  Order.find.mockReturnValue(limited([]));
  expect(await jobs.completeDeliveredOrders(now)).toBe(0);
  expect(Dispute.distinct).not.toHaveBeenCalled();
});

test('paid orders not shipped within the configured window are refunded and cancelled through escrow (AC-SYS-03-1)', async () => {
  Order.find.mockReturnValue(limited([{ _id: 'late' }]));

  expect(await jobs.refundUnshippedOrders(now)).toBe(1);

  expect(Order.find).toHaveBeenCalledWith({ status: 'paid', paidAt: { $lte: new Date(now.getTime() - business.shippingWindowMs) } });
  expect(escrowService.refundFunds).toHaveBeenCalledWith('late', expect.any(String));
});
