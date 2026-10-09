function positiveInteger(value, fallback) {
  if (!['string', 'number'].includes(typeof value)) return fallback;
  if (typeof value === 'string' && !/^\d+$/.test(value)) return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function pagination(query = {}) {
  const limit = Math.min(positiveInteger(query.limit, 20), 100);
  const page = Math.min(positiveInteger(query.page, 1), Math.floor(Number.MAX_SAFE_INTEGER / limit));
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { pagination };
