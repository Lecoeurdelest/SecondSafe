const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadBusinessConfig } = require('../src/config/business');

test('money defaults match the accepted WDP values', () => {
  expect(loadBusinessConfig({})).toMatchObject({ feeRate: 0.05, topUp: { min: 10000, max: 500000000 }, withdrawalMin: 50000 });
});

test('time defaults match the plan, retaining the proposed payment decision at 3 minutes', () => {
  expect(loadBusinessConfig({})).toMatchObject({
    otpTtlMs: 300000, paymentWindowMs: 180000, shippingWindowMs: 86400000,
    autoCompletionWindowMs: 432000000, listingMaxAgeMs: 2592000000,
    resetCredentialTtlMs: 3600000, jwtTtlSeconds: 604800
  });
});

test('valid overrides use the documented units and do not change unrelated defaults', () => {
  expect(loadBusinessConfig({ PLATFORM_FEE_RATE: '0.1', TOPUP_MIN_AMOUNT: '20000', PAYMENT_WINDOW_MS: '900000', JWT_TTL_SECONDS: '3600' }))
    .toMatchObject({ feeRate: 0.1, topUp: { min: 20000, max: 500000000 }, paymentWindowMs: 900000, jwtTtlSeconds: 3600 });
});

test.each(['', '-1', '1.5', 'Infinity', 'NaN', '0x10', '10000junk', '9007199254740992', '0'])('invalid integer amount %s is refused', value => {
  expect(() => loadBusinessConfig({ TOPUP_MIN_AMOUNT: value })).toThrow('TOPUP_MIN_AMOUNT');
});

test.each(['-0.1', '1.1', '', 'NaN'])('invalid fee rate %s is refused', value => {
  expect(() => loadBusinessConfig({ PLATFORM_FEE_RATE: value })).toThrow('PLATFORM_FEE_RATE');
});

test('zero and full fee rates are represented exactly and reversed top-up bounds are refused', () => {
  expect(loadBusinessConfig({ PLATFORM_FEE_RATE: '0' }).feeRate).toBe(0);
  expect(loadBusinessConfig({ PLATFORM_FEE_RATE: '1' }).feeRate).toBe(1);
  expect(() => loadBusinessConfig({ TOPUP_MIN_AMOUNT: '20000', TOPUP_MAX_AMOUNT: '10000' })).toThrow('exceeds');
});

test('all timer overrides are validated as positive safe integers', () => {
  const names = ['OTP_TTL_MS', 'PAYMENT_WINDOW_MS', 'SHIPPING_WINDOW_MS', 'AUTO_COMPLETION_WINDOW_MS', 'LISTING_MAX_AGE_MS', 'RESET_CREDENTIAL_TTL_MS', 'JWT_TTL_SECONDS'];
  for (const name of names) expect(() => loadBusinessConfig({ [name]: '0' })).toThrow(name);
});

test('nested configuration is immutable and sanction defaults are preserved', () => {
  const config = loadBusinessConfig({});
  expect(Object.isFrozen(config)).toBe(true);
  expect(Object.isFrozen(config.topUp)).toBe(true);
  expect(Object.isFrozen(config.sanctionThresholds)).toBe(true);
  expect(config.sanctionThresholds).toEqual([3, 6, 9]);
  expect(config.disputeRestrictionThreshold).toBe(3);
});

test('every override is documented and invalid startup configuration fails closed without echoing the value', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/config/business.js'), 'utf8');
  const example = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');
  const names = [...source.matchAll(/setting\(env, '([A-Z_]+)'/g)].map(match => match[1]);
  for (const name of names) expect(example).toContain(`${name}=`);
  const result = spawnSync(process.execPath, ['-e', "require('./src/config/business')"], {
    cwd: path.join(__dirname, '..'), encoding: 'utf8', env: { ...process.env, OTP_TTL_MS: 'private-invalid-value' }
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Invalid business configuration: OTP_TTL_MS');
  expect(result.stderr).not.toContain('private-invalid-value');
});
