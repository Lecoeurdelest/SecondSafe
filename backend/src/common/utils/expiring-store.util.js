function createMemoryStore({ now = Date.now, maxEntries = 10000 } = {}) {
  if (!Number.isSafeInteger(maxEntries) || maxEntries <= 0) throw new TypeError('Store capacity must be positive');
  const records = new Map();

  function discardExpired() {
    for (const [key, record] of records) {
      if (record.expiresAt <= now()) records.delete(key);
    }
  }

  // Shared adapters must implement this read/update/delete operation atomically per key.
  async function update(key, updater) {
    let previous = records.get(key);
    if (previous && previous.expiresAt <= now()) {
      records.delete(key);
      previous = undefined;
    }
    const { record, result } = updater(structuredClone(previous));
    if (!record) {
      records.delete(key);
      return result;
    }
    if (!records.has(key) && records.size >= maxEntries) discardExpired();
    if (!records.has(key) && records.size >= maxEntries) {
      throw Object.assign(new Error('Dịch vụ xác thực đang bận. Vui lòng thử lại sau.'), { statusCode: 503, expose: true });
    }
    records.set(key, structuredClone(record));
    return result;
  }

  return { update };
}

module.exports = { createMemoryStore };
