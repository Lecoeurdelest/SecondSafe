jest.mock('../src/common/utils/logger.util', () => ({ error: jest.fn() }));
const express = require('express');
const request = require('supertest');
const { createAuthRateLimit } = require('../src/common/middlewares/rate-limit.middleware');
const { createMemoryCounterStore } = require('../src/common/utils/rate-limit-store.util');
const { errorHandler } = require('../src/common/middlewares/error.middleware');
const business = require('../src/config/business');

function fixture(options = {}) {
  const app = express();
  app.use(express.json());
  const store = options.store || createMemoryCounterStore({ now: options.now });
  app.post('/login', createAuthRateLimit({ scope: 'login', ...options, store }), (req, res) => res.sendStatus(204));
  app.post('/code', createAuthRateLimit({ scope: 'code', ...options, store }), (req, res) => res.sendStatus(204));
  app.use(errorHandler);
  return app;
}

test('rejects missing scopes and invalid limits before handling requests', () => {
  expect(() => createAuthRateLimit()).toThrow('scope');
  expect(() => createAuthRateLimit({ scope: null })).toThrow('scope');
  expect(() => createAuthRateLimit({ scope: 'login', limit: 0 })).toThrow('positive');
  expect(() => createAuthRateLimit({ scope: 'login', windowMs: -1 })).toThrow('positive');
  expect(() => createMemoryCounterStore({ maxEntries: 0 })).toThrow('positive');
});

test('default five requests succeed; sixth is 429 with Retry-After', async () => {
  expect(business.authRateLimit).toEqual({ requests: 5, windowMs: 60000 });
  const app = fixture();
  for (let attempt = 0; attempt < 5; attempt += 1) expect((await request(app).post('/login').send({ email: 'a@example.com' })).status).toBe(204);
  const blocked = await request(app).post('/login').send({ email: 'a@example.com' });
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  expect(blocked.body.message).toBe('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
});

test('rotating email does not bypass the IP limit', async () => {
  const app = fixture({ limit: 1 });
  expect((await request(app).post('/login').send({ email: 'first@example.com' })).status).toBe(204);
  expect((await request(app).post('/login').send({ email: 'second@example.com' })).status).toBe(429);
});

test('email is normalized and shared across IPs', async () => {
  const app = express();
  const store = createMemoryCounterStore();
  app.use(express.json());
  app.use((req, res, next) => { Object.defineProperty(req, 'ip', { value: req.get('Fixture-IP') }); next(); });
  app.post('/', createAuthRateLimit({ scope: 'email', store, limit: 1 }), (req, res) => res.sendStatus(204));
  expect((await request(app).post('/').set('Fixture-IP', '192.0.2.1').send({ email: ' Person@example.com ' })).status).toBe(204);
  expect((await request(app).post('/').set('Fixture-IP', '192.0.2.2').send({ email: 'person@EXAMPLE.COM' })).status).toBe(429);
});

test('untrusted forwarded IP does not bypass Express default peer identification', async () => {
  const app = fixture({ limit: 1 });
  await request(app).post('/login').set('X-Forwarded-For', '192.0.2.1');
  expect((await request(app).post('/login').set('X-Forwarded-For', '192.0.2.2')).status).toBe(429);
});

test('window reopens exactly at expiry with correct retry seconds', async () => {
  let time = 1000;
  const app = fixture({ limit: 1, now: () => time });
  await request(app).post('/login').send({ email: 'a@example.com' });
  time += 10000;
  const response = await request(app).post('/login').send({ email: 'a@example.com' });
  expect(response.status).toBe(429);
  expect(response.headers['retry-after']).toBe('50');
  time += 50000;
  expect((await request(app).post('/login').send({ email: 'a@example.com' })).status).toBe(204);
});

test('endpoint scopes are independent', async () => {
  const app = fixture({ limit: 1 });
  await request(app).post('/login').send({ email: 'a@example.com' });
  expect((await request(app).post('/login').send({ email: 'a@example.com' })).status).toBe(429);
  expect((await request(app).post('/code').send({ email: 'a@example.com' })).status).toBe(204);
});

test('missing or malformed email still consumes the IP budget', async () => {
  const app = fixture({ limit: 1 });
  expect((await request(app).post('/login').send({ email: { $ne: null } })).status).toBe(204);
  expect((await request(app).post('/login')).status).toBe(429);
});

test('counter adapter receives hashed keys and configured window', async () => {
  const store = { increment: jest.fn(async () => ({ count: 1, resetAt: Date.now() + 60000 })) };
  await request(fixture({ store })).post('/login').send({ email: 'private@example.com' });
  expect(store.increment).toHaveBeenCalledTimes(2);
  for (const [key, windowMs] of store.increment.mock.calls) {
    expect(key).not.toContain('private@example.com');
    expect(key).toMatch(/^rate:login:(ip|email):[a-f0-9]{64}$/);
    expect(windowMs).toBe(60000);
  }
});

test('concurrent requests cannot bypass the default budget', async () => {
  const app = fixture();
  const responses = await Promise.all(Array.from({ length: 20 }, () => request(app).post('/login').send({ email: 'a@example.com' })));
  expect(responses.filter(response => response.status === 204)).toHaveLength(5);
  expect(responses.filter(response => response.status === 429)).toHaveLength(15);
});

test('store failures fail closed through the safe error boundary', async () => {
  const store = { increment: async () => { throw new Error('private counter backend'); } };
  const response = await request(fixture({ store })).post('/login');
  expect(response.status).toBe(500);
  expect(response.body.message).toBe('Lỗi hệ thống, vui lòng thử lại sau');
});

test('memory counter capacity is bounded and expired counters are reclaimed', async () => {
  let time = 0;
  const store = createMemoryCounterStore({ now: () => time, maxEntries: 1 });
  expect(await store.increment('one', 10)).toEqual({ count: 1, resetAt: 10 });
  await expect(store.increment('two', 10)).rejects.toHaveProperty('statusCode', 503);
  time = 10;
  expect(await store.increment('two', 10)).toEqual({ count: 1, resetAt: 20 });
});

test.each(['/login', '/register/request-otp', '/register/verify', '/login/verify-2fa', '/forgot-password', '/reset-password'])('actual auth router limits %s before its future controller', async route => {
  let app;
  jest.isolateModules(() => { app = require('../src/app'); });
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await request(app).post(`/api/auth${route}`).send({ email: 'router@example.com' });
    expect(response.status).toBe(404);
  }
  response = await request(app).post(`/api/auth${route}`).send({ email: 'router@example.com' });
  expect(response.status).toBe(429);
});
