jest.mock('../src/modules/orders/abandoned-checkout.model', () => {
  const model = {
    updateOne: jest.fn(), exists: jest.fn(), create: jest.fn(), find: jest.fn(), findOneAndUpdate: jest.fn(),
    aggregate: jest.fn(), countDocuments: jest.fn()
  };
  model.STATUSES = ['at_risk', 'open', 'recovered', 'dismissed', 'expired'];
  model.SOURCES = ['order', 'cart'];
  return model;
});
jest.mock('../src/modules/orders/order.model', () => ({ find: jest.fn(), findById: jest.fn(), findOne: jest.fn() }));
jest.mock('../src/modules/users/cart-item.model', () => ({ find: jest.fn(), exists: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/products/product-availability.service', () => ({ getEligibleProductIds: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));

const AbandonedCheckout = require('../src/modules/orders/abandoned-checkout.model');
const Order = require('../src/modules/orders/order.model');
const CartItem = require('../src/modules/users/cart-item.model');
const Product = require('../src/modules/products/product.model');
const { getEligibleProductIds } = require('../src/modules/products/product-availability.service');
const { createNotification } = require('../src/modules/notifications/notification.service');
const business = require('../src/config/business');
const service = require('../src/modules/orders/abandoned-checkout.service');

const now = new Date('2026-11-10T10:00:00Z');
const buyerId = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';
const orderId = '507f1f77bcf86cd799439013';
const checkoutId = '507f1f77bcf86cd799439014';

function chain(value) {
  const query = { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['select', 'sort', 'limit', 'skip', 'populate']) query[method] = jest.fn(() => query);
  query.lean = jest.fn().mockResolvedValue(value);
  return query;
}

const unpaidOrder = { _id: orderId, buyerId, sellerId: 'seller', productId, totalToPay: 105000, paymentDeadline: new Date(now.getTime() + 30000) };

beforeEach(() => {
  jest.resetAllMocks();
  Product.findById.mockReturnValue(chain({ title: 'Sách cũ' }));
  getEligibleProductIds.mockResolvedValue([productId]);
});

test('a buyer is reminded once while the order can still be paid', async () => {
  Order.find.mockReturnValue(chain([unpaidOrder]));
  AbandonedCheckout.updateOne.mockResolvedValueOnce({ upsertedCount: 1 }).mockResolvedValueOnce({ upsertedCount: 0 });

  expect(await service.remindExpiringPayments(now)).toBe(1);
  expect(await service.remindExpiringPayments(now)).toBe(0);

  expect(Order.find).toHaveBeenCalledWith({
    status: 'awaiting_payment',
    paymentDeadline: { $gt: now, $lte: new Date(now.getTime() + business.checkoutReminderLeadMs) }
  });
  expect(AbandonedCheckout.updateOne.mock.calls[0][1].$setOnInsert).toMatchObject({ status: 'at_risk', source: 'order', amount: 105000, reminderCount: 1 });
  expect(createNotification).toHaveBeenCalledTimes(1);
  expect(createNotification).toHaveBeenCalledWith(buyerId, expect.objectContaining({ orderId, title: 'Đơn hàng sắp hết hạn thanh toán' }));
});

test('a timed-out order becomes an open abandoned checkout with a recovery deadline', async () => {
  await service.recordAbandonedOrder(unpaidOrder, now);

  const [filter, update, options] = AbandonedCheckout.updateOne.mock.calls[0];
  expect(filter).toEqual({ orderId });
  expect(update.$set).toEqual({ status: 'open', abandonedAt: now, expiresAt: new Date(now.getTime() + business.abandonedCheckoutTtlMs) });
  expect(options).toEqual({ upsert: true });
  expect(createNotification).toHaveBeenCalledWith(buyerId, expect.objectContaining({ productId, title: 'Thanh toán chưa hoàn tất' }));
});

test('a failed notification never fails the checkout record', async () => {
  createNotification.mockRejectedValue(new Error('socket down'));
  await expect(service.recordAbandonedOrder(unpaidOrder, now)).resolves.toBeUndefined();
});

test('an old cart item triggers one reminder and is not reminded again', async () => {
  const item = { user: buyerId, product: { _id: productId, title: 'Sách cũ', price: 100000, seller: 'seller' }, createdAt: new Date('2026-11-08T00:00:00Z') };
  CartItem.find.mockReturnValue(chain([item]));
  AbandonedCheckout.exists.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: checkoutId });

  expect(await service.detectAbandonedCarts(now)).toBe(1);
  expect(await service.detectAbandonedCarts(now)).toBe(0);

  expect(CartItem.find).toHaveBeenCalledWith({
    product: { $in: [productId] },
    createdAt: { $lte: new Date(now.getTime() - business.cartAbandonAfterMs) }
  });
  expect(AbandonedCheckout.create).toHaveBeenCalledTimes(1);
  expect(AbandonedCheckout.create).toHaveBeenCalledWith(expect.objectContaining({ source: 'cart', status: 'open', amount: 100000, buyerId }));
  expect(createNotification).toHaveBeenCalledTimes(1);
});

test('reconcile marks paid checkouts recovered and unavailable or stale ones expired', async () => {
  const checkouts = [
    { _id: 'paid-in-time', status: 'at_risk', source: 'order', orderId, buyerId, productId },
    { _id: 'bought-again', status: 'open', source: 'order', buyerId, productId, abandonedAt: now },
    { _id: 'listing-gone', status: 'open', source: 'order', buyerId, productId: 'sold-elsewhere', abandonedAt: now },
    { _id: 'cart-emptied', status: 'open', source: 'cart', buyerId, productId, abandonedAt: now },
    { _id: 'still-open', status: 'open', source: 'cart', buyerId, productId, abandonedAt: now, expiresAt: new Date(now.getTime() + 1000) }
  ];
  AbandonedCheckout.find.mockReturnValue(chain(checkouts));
  Order.findById.mockReturnValue(chain({ _id: orderId, status: 'paid' }));
  Order.findOne.mockReturnValueOnce(chain({ _id: 'new-order' })).mockReturnValue(chain(null));
  CartItem.exists.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: 'item' });

  expect(await service.reconcile(now)).toEqual({ recovered: 2, expired: 2 });

  const changes = Object.fromEntries(AbandonedCheckout.updateOne.mock.calls.map(([filter, update]) => [filter._id, update.$set]));
  expect(changes['paid-in-time']).toMatchObject({ status: 'recovered', recoveredOrderId: orderId, recoveredAt: now });
  expect(changes['bought-again']).toMatchObject({ status: 'recovered', recoveredOrderId: 'new-order' });
  expect(changes['listing-gone']).toEqual({ status: 'expired' });
  expect(changes['cart-emptied']).toEqual({ status: 'expired' });
  expect(changes['still-open']).toBeUndefined();
});

test('a buyer sees only their own unfinished checkouts with the next action', async () => {
  AbandonedCheckout.find.mockReturnValue(chain([
    { _id: 'a', status: 'at_risk', source: 'order', amount: 105000, productId: { _id: productId, title: 'Sách cũ' }, orderId: { _id: orderId, status: 'awaiting_payment', paymentDeadline: unpaidOrder.paymentDeadline } },
    { _id: 'b', status: 'open', source: 'cart', amount: 100000, productId: { _id: productId, title: 'Sách cũ' } },
    { _id: 'c', status: 'open', source: 'cart', amount: 1, productId: null }
  ]));

  const result = await service.listForBuyer(buyerId);

  expect(AbandonedCheckout.find).toHaveBeenCalledWith({ buyerId, status: { $in: ['at_risk', 'open'] } });
  expect(result).toHaveLength(2);
  expect(result[0]).toMatchObject({ action: 'resume_payment', orderId, paymentDeadline: unpaidOrder.paymentDeadline });
  expect(result[1]).toMatchObject({ action: 'buy_again', orderId: null });
});

test('dismissing is limited to the owner', async () => {
  AbandonedCheckout.findOneAndUpdate.mockReturnValue(chain(null));
  await expect(service.dismiss(buyerId, checkoutId)).rejects.toMatchObject({ statusCode: 404 });
  expect(AbandonedCheckout.findOneAndUpdate.mock.calls[0][0]).toMatchObject({ _id: checkoutId, buyerId });
  await expect(service.dismiss(buyerId, 'not-an-id')).rejects.toMatchObject({ statusCode: 404 });

  AbandonedCheckout.findOneAndUpdate.mockReturnValue(chain({ _id: checkoutId, status: 'dismissed' }));
  expect(await service.dismiss(buyerId, checkoutId)).toEqual({ _id: checkoutId, status: 'dismissed' });
});

test('the staff summary reports recovery rate and amounts by source', async () => {
  AbandonedCheckout.aggregate.mockResolvedValue([
    { _id: { status: 'recovered', source: 'order' }, count: 1, amount: 100000 },
    { _id: { status: 'expired', source: 'order' }, count: 2, amount: 300000 },
    { _id: { status: 'dismissed', source: 'cart' }, count: 1, amount: 50000 },
    { _id: { status: 'open', source: 'cart' }, count: 3, amount: 90000 }
  ]);

  const summary = await service.getSummary({ from: '2026-11-01', to: '2026-11-30' });

  expect(summary).toMatchObject({ total: 7, recovered: 1, lost: 3, active: 3, recoveredAmount: 100000, lostAmount: 350000, activeAmount: 90000, recoveryRate: 25 });
  expect(summary.bySource.order).toMatchObject({ total: 3, recoveryRate: 33.3 });
  expect(summary.bySource.cart).toMatchObject({ total: 4, recovered: 0, recoveryRate: 0 });
  await expect(service.getSummary({ from: 'yesterday' })).rejects.toMatchObject({ statusCode: 400 });
  await expect(service.getSummary({ from: '2026-12-01', to: '2026-11-01' })).rejects.toMatchObject({ statusCode: 400 });
});
