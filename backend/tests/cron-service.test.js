jest.mock('../src/services/order-jobs.service', () => ({
  cancelUnpaidOrders: jest.fn(), completeDeliveredOrders: jest.fn(), refundUnshippedOrders: jest.fn()
}));
jest.mock('../src/modules/orders/abandoned-checkout.service', () => ({
  remindExpiringPayments: jest.fn(), reconcile: jest.fn(), detectAbandonedCarts: jest.fn()
}));

const logger = require('../src/common/utils/logger.util');
const orderJobs = require('../src/services/order-jobs.service');
const abandonedCheckoutService = require('../src/modules/orders/abandoned-checkout.service');
const { startAllCronJobs, stopAllCronJobs, runJob, JOBS } = require('../src/services/cron.service');

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  jest.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => {
  stopAllCronJobs();
  jest.useRealTimers();
});

test('schedules every order lifecycle and abandoned checkout job once', () => {
  expect(startAllCronJobs()).toBe(JOBS.length);
  expect(startAllCronJobs()).toBe(JOBS.length);
  expect(jest.getTimerCount()).toBe(JOBS.length);
  expect(JOBS.map(job => job.name)).toEqual(expect.arrayContaining([
    'payment-timeout', 'auto-complete-delivered', 'late-shipping-refund',
    'checkout-payment-reminder', 'abandoned-cart-detection', 'abandoned-checkout-reconcile'
  ]));
});

test('the payment timeout job runs every minute and the payment reminder twice as often (AC-SYS-01-1)', async () => {
  orderJobs.cancelUnpaidOrders.mockResolvedValue(0);
  startAllCronJobs();
  await jest.advanceTimersByTimeAsync(3 * 60 * 1000);
  expect(orderJobs.cancelUnpaidOrders).toHaveBeenCalledTimes(3);
  expect(abandonedCheckoutService.remindExpiringPayments).toHaveBeenCalledTimes(6);
  expect(orderJobs.completeDeliveredOrders).not.toHaveBeenCalled();
});

test('completion and late-shipping refunds run hourly (AC-SYS-02-1, AC-SYS-03-1)', async () => {
  startAllCronJobs();
  await jest.advanceTimersByTimeAsync(2 * 60 * 60 * 1000);
  expect(orderJobs.completeDeliveredOrders).toHaveBeenCalledTimes(2);
  expect(orderJobs.refundUnshippedOrders).toHaveBeenCalledTimes(2);
});

test('a failing job is logged and a running job is not started twice (AC-NFR-REL-03-1)', async () => {
  const job = { name: 'slow', run: jest.fn() };
  let finish;
  job.run.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = runJob(job);
  expect(await runJob(job)).toBeNull();
  finish(2);
  expect(await first).toBe(2);
  expect(job.run).toHaveBeenCalledTimes(1);

  job.run.mockRejectedValueOnce(new Error('database down'));
  expect(await runJob(job)).toBeNull();
  expect(logger.error).toHaveBeenCalledWith('Scheduled job failed', { job: 'slow', error: 'database down' });
});
