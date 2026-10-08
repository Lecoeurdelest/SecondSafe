function setting(env, name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER, integer = true } = {}) {
  if (env[name] === undefined) return fallback;
  const raw = String(env[name]).trim();
  const value = /^\d+(\.\d+)?$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isSafeInteger(value))) {
    throw new Error(`Invalid business configuration: ${name}`);
  }
  return value;
}

function loadBusinessConfig(env = process.env) {
  const topUp = Object.freeze({
    min: setting(env, 'TOPUP_MIN_AMOUNT', 10000),
    max: setting(env, 'TOPUP_MAX_AMOUNT', 500000000)
  });
  if (topUp.min > topUp.max) throw new Error('Invalid business configuration: TOPUP_MIN_AMOUNT exceeds TOPUP_MAX_AMOUNT');
  return Object.freeze({
    feeRate: setting(env, 'PLATFORM_FEE_RATE', 0.05, { min: 0, max: 1, integer: false }),
    topUp,
    withdrawalMin: setting(env, 'WITHDRAWAL_MIN_AMOUNT', 50000),
    otpTtlMs: setting(env, 'OTP_TTL_MS', 5 * 60 * 1000),
    paymentWindowMs: setting(env, 'PAYMENT_WINDOW_MS', 3 * 60 * 1000),
    shippingWindowMs: setting(env, 'SHIPPING_WINDOW_MS', 24 * 60 * 60 * 1000),
    autoCompletionWindowMs: setting(env, 'AUTO_COMPLETION_WINDOW_MS', 5 * 24 * 60 * 60 * 1000),
    listingMaxAgeMs: setting(env, 'LISTING_MAX_AGE_MS', 30 * 24 * 60 * 60 * 1000),
    resetCredentialTtlMs: setting(env, 'RESET_CREDENTIAL_TTL_MS', 60 * 60 * 1000),
    jwtTtlSeconds: setting(env, 'JWT_TTL_SECONDS', 7 * 24 * 60 * 60),
    reportRestrictionThreshold: setting(env, 'REPORT_RESTRICTION_THRESHOLD', 3),
    sanctionThresholds: Object.freeze([3, 6, 9]),
    sanctionDurationsMs: Object.freeze([24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000, 365 * 24 * 60 * 60 * 1000]),
    disputeRestrictionThreshold: setting(env, 'DISPUTE_RESTRICTION_THRESHOLD', 3),
    disputeRestrictionDurationMs: setting(env, 'DISPUTE_RESTRICTION_DURATION_MS', 30 * 24 * 60 * 60 * 1000)
  });
}

module.exports = Object.freeze({ ...loadBusinessConfig(), loadBusinessConfig });
