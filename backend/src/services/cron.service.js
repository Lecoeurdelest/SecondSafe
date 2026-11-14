const orderJobs = require('./order-jobs.service');
const abandonedCheckoutService = require('../modules/orders/abandoned-checkout.service');
const logger = require('../common/utils/logger.util');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// A job repeats every `everyMs`, or once a day at the local wall-clock hour `dailyAtHour`.
const JOBS = Object.freeze([
  // Ticks faster than the reminder lead time so a reminder always lands well before the deadline.
  { name: 'checkout-payment-reminder', everyMs: MINUTE / 2, run: now => abandonedCheckoutService.remindExpiringPayments(now) },
  { name: 'payment-timeout', everyMs: MINUTE, run: now => orderJobs.cancelUnpaidOrders(now) },
  { name: 'abandoned-checkout-reconcile', everyMs: 5 * MINUTE, run: now => abandonedCheckoutService.reconcile(now) },
  { name: 'auto-complete-delivered', everyMs: HOUR, run: now => orderJobs.completeDeliveredOrders(now) },
  { name: 'late-shipping-refund', everyMs: HOUR, run: now => orderJobs.refundUnshippedOrders(now) },
  { name: 'abandoned-cart-detection', everyMs: HOUR, run: now => abandonedCheckoutService.detectAbandonedCarts(now) },
  { name: 'listing-expiry', dailyAtHour: 3, run: now => orderJobs.expireOldListings(now) }
]);

// Jobs an external scheduler may trigger where the long-lived server (and its timers) is not running.
const ON_DEMAND_JOBS = Object.freeze(['payment-timeout']);

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

// Unlike runJob, a failure propagates so the scheduler's call fails visibly.
async function runJobOnDemand(name, now = new Date()) {
  const job = ON_DEMAND_JOBS.includes(name) ? JOBS.find(candidate => candidate.name === name) : undefined;
  if (!job) return undefined;
  return { job: name, processed: await job.run(now) };
}

function msUntilHour(hour, now = new Date()) {
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function keep(job, timer) {
  timer.unref();
  timers.set(job.name, timer);
}

// Re-arms after every run so the job stays on the wall-clock hour.
function scheduleDaily(job) {
  keep(job, setTimeout(() => {
    runJob(job);
    scheduleDaily(job);
  }, msUntilHour(job.dailyAtHour)));
}

function schedule(job) {
  if (job.dailyAtHour !== undefined) return scheduleDaily(job);
  return keep(job, setInterval(() => runJob(job), job.everyMs));
}

function startAllCronJobs() {
  if (timers.size) return timers.size;
  JOBS.forEach(schedule);
  logger.info('Scheduled jobs started', { jobs: JOBS.map(job => job.name) });
  return timers.size;
}

function stopAllCronJobs() {
  for (const timer of timers.values()) {
    clearInterval(timer);
    clearTimeout(timer);
  }
  timers.clear();
}

module.exports = { startAllCronJobs, stopAllCronJobs, runJob, runJobOnDemand, msUntilHour, JOBS, ON_DEMAND_JOBS };
