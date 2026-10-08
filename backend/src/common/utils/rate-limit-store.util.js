function createMemoryCounterStore({ now = Date.now, maxEntries = 10000 } = {}) {
  if (!Number.isSafeInteger(maxEntries) || maxEntries <= 0) throw new TypeError('Counter-store capacity must be positive');
  const counters = new Map();

  function reclaimExpired() {
    for (const [key, counter] of counters) {
      if (counter.resetAt <= now()) counters.delete(key);
    }
  }

  // Shared adapters must atomically increment and establish the first request's expiry.
  async function increment(key, windowMs) {
    let counter = counters.get(key);
    if (counter && counter.resetAt <= now()) {
      counters.delete(key);
      counter = undefined;
    }
    if (!counter && counters.size >= maxEntries) reclaimExpired();
    if (!counter && counters.size >= maxEntries) {
      throw Object.assign(new Error('Dịch vụ xác thực đang bận. Vui lòng thử lại sau.'), { statusCode: 503, expose: true });
    }
    counter ||= { count: 0, resetAt: now() + windowMs };
    counter.count += 1;
    counters.set(key, counter);
    return { ...counter };
  }

  return { increment };
}

module.exports = { createMemoryCounterStore };
