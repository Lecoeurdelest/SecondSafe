const orderJobs = require('./order-jobs.service');
const abandonedCheckoutService = require('../modules/orders/abandoned-checkout.service');
const logger = require('../common/utils/logger.util');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const JOBS = Object.freeze([
  // Ticks faster than the reminder lead time so a reminder always lands well before the deadline.
  { name: 'checkout-payment-reminder', everyMs: MINUTE / 2, run: now => abandonedCheckoutService.remindExpiringPayments(now) },
  { name: 'payment-timeout', everyMs: MINUTE, run: now => orderJobs.cancelUnpaidOrders(now) },
  { name: 'abandoned-checkout-reconcile', everyMs: 5 * MINUTE, run: now => abandonedCheckoutService.reconcile(now) },
  { name: 'auto-complete-delivered', everyMs: HOUR, run: now => orderJobs.completeDeliveredOrders(now) },
  { name: 'late-shipping-refund', everyMs: HOUR, run: now => orderJobs.refundUnshippedOrders(now) },
  { name: 'abandoned-cart-detection', everyMs: HOUR, run: now => abandonedCheckoutService.detectAbandonedCarts(now) }
]);

const running = new Set();
const timers = new Map();

// NFR-REL-03: a slow run is skipped rather than overlapped, and a failure never reaches the process.
async function runJob(job, now = new Date()) {
  if (running.has(job.name)) return null;
  running.add(job.name);
  try {
    const result = await job.run(now);
    logger.debug('Scheduled job finished', { job: job.name, result });
    return result;
  } catch (error) {
    logger.error('Scheduled job failed', { job: job.name, error: error.message });
    return null;
  } finally {
    running.delete(job.name);
  }
}

function schedule(job) {
  const timer = setInterval(() => runJob(job), job.everyMs);
  timer.unref();
  timers.set(job.name, timer);
}

function startAllCronJobs() {
  if (timers.size) return timers.size;
  JOBS.forEach(schedule);
  logger.info('Scheduled jobs started', { jobs: JOBS.map(job => job.name) });
  return timers.size;
}

function stopAllCronJobs() {
  for (const timer of timers.values()) clearInterval(timer);
  timers.clear();
}

module.exports = { startAllCronJobs, stopAllCronJobs, runJob, JOBS };
