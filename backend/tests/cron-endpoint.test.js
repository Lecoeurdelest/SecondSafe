jest.mock('../src/services/order-jobs.service', () => ({
  cancelUnpaidOrders: jest.fn(), completeDeliveredOrders: jest.fn(), refundUnshippedOrders: jest.fn(), expireOldListings: jest.fn()
}));
jest.mock('../src/modules/orders/abandoned-checkout.service', () => ({
  remindExpiringPayments: jest.fn(), reconcile: jest.fn(), detectAbandonedCarts: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const logger = require('../src/common/utils/logger.util');
const orderJobs = require('../src/services/order-jobs.service');
const cronRoutes = require('../src/modules/system/cron.route');
const { errorHandler } = require('../src/common/middlewares/error.middleware');

const SECRET = 'cron-unit-test-secret';
const bearer = token => `Bearer ${token}`;

function app() {
  const fixture = express();
  fixture.use('/api/internal/cron', cronRoutes);
  fixture.use(errorHandler);
  return fixture;
}

beforeEach(() => {
  jest.resetAllMocks();
  process.env.CRON_SECRET = SECRET;
  jest.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  jest.restoreAllMocks();
});

test('stays disabled until a cron secret is configured', async () => {
  delete process.env.CRON_SECRET;
  const response = await request(app()).get('/api/internal/cron/payment-timeout').set('Authorization', bearer(''));
  expect(response.status).toBe(503);
  expect(orderJobs.cancelUnpaidOrders).not.toHaveBeenCalled();
});

test('rejects a missing, malformed or wrong bearer token', async () => {
  for (const header of [undefined, SECRET, bearer('wrong'), bearer(`${SECRET}x`), bearer(SECRET.slice(1))]) {
    const call = request(app()).get('/api/internal/cron/payment-timeout');
    const response = await (header === undefined ? call : call.set('Authorization', header));
    expect(response.status).toBe(401);
  }
  expect(orderJobs.cancelUnpaidOrders).not.toHaveBeenCalled();
});

test('runs the payment timeout job for an authorised GET and reports how many orders it cancelled', async () => {
  orderJobs.cancelUnpaidOrders.mockResolvedValue(3);
  const response = await request(app()).get('/api/internal/cron/payment-timeout').set('Authorization', bearer(SECRET));
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({ success: true, data: { job: 'payment-timeout', processed: 3 } });
  expect(orderJobs.cancelUnpaidOrders).toHaveBeenCalledTimes(1);
  expect(orderJobs.cancelUnpaidOrders.mock.calls[0][0]).toBeInstanceOf(Date);
});

test('accepts POST as well', async () => {
  orderJobs.cancelUnpaidOrders.mockResolvedValue(0);
  const response = await request(app()).post('/api/internal/cron/payment-timeout').set('Authorization', bearer(SECRET));
  expect(response.status).toBe(200);
  expect(response.body.data.processed).toBe(0);
});

test('only the allow-listed job can be triggered over HTTP', async () => {
  for (const job of ['listing-expiry', 'auto-complete-delivered', 'late-shipping-refund', 'does-not-exist']) {
    const response = await request(app()).post(`/api/internal/cron/${job}`).set('Authorization', bearer(SECRET));
    expect(response.status).toBe(404);
  }
  expect(orderJobs.expireOldListings).not.toHaveBeenCalled();
  expect(orderJobs.completeDeliveredOrders).not.toHaveBeenCalled();
  expect(orderJobs.refundUnshippedOrders).not.toHaveBeenCalled();
});

test('a failing job answers with an error status so the scheduler run fails visibly', async () => {
  orderJobs.cancelUnpaidOrders.mockRejectedValue(new Error('database unavailable'));
  const response = await request(app()).get('/api/internal/cron/payment-timeout').set('Authorization', bearer(SECRET));
  expect(response.status).toBe(500);
  expect(response.body.success).toBe(false);
});
