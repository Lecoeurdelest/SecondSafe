const express = require('express');
const request = require('supertest');
const { pagination } = require('../src/common/utils/pagination.util');
const { sendSuccess, sendError, sendPaginated } = require('../src/common/utils/response.util');
const { errorHandler } = require('../src/common/middlewares/error.middleware');
const { createLogger } = require('../src/common/utils/logger.util');
const { availableRouter } = require('../src/common/middlewares/available-router.middleware');
const logger = require('../src/common/utils/logger.util');
const app = require('../src/app');

beforeEach(() => jest.spyOn(logger, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

test('security headers apply to health, missing resources and CORS errors', async () => {
  for (const path of ['/api/health', '/api/missing']) {
    const response = await request(app).get(path);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeTruthy();
    expect(response.headers['x-powered-by']).toBeUndefined();
  }
  const denied = await request(app).get('/api/health').set('Origin', 'https://untrusted.example');
  expect(denied.status).toBe(403);
  expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  expect(denied.body).toEqual({ success: false, message: 'Nguồn truy cập không được phép' });
  expect(denied.headers['x-content-type-options']).toBe('nosniff');
});

test('one CORS policy permits the configured frontend including preflight', async () => {
  const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
  const response = await request(app).options('/api/health').set('Origin', origin).set('Access-Control-Request-Method', 'GET');
  expect(response.status).toBe(204);
  expect(response.headers['access-control-allow-origin']).toBe(origin);
  expect(response.headers['access-control-allow-credentials']).toBe('true');
});

test('JSON and form payloads larger than 1 MB are rejected', async () => {
  const payload = 'x'.repeat(1024 * 1024);
  for (const type of ['json', 'form']) {
    const response = await request(app).post('/api/unimplemented').type(type).send({ payload });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ success: false, message: 'Dữ liệu yêu cầu vượt quá giới hạn 1 MB' });
  }
});

test('malformed JSON and unknown endpoints use Vietnamese JSON errors', async () => {
  const invalid = await request(app).post('/api/auth/login').type('json').send('{');
  expect(invalid.status).toBe(400);
  expect(invalid.body.message).toBe('Dữ liệu JSON không hợp lệ');
  const missing = await request(app).get('/api/missing');
  expect(missing.status).toBe(404);
  expect(missing.body).toEqual({ success: false, message: 'Không tìm thấy tài nguyên' });
});

test.each([
  [{}, { page: 1, limit: 20, skip: 0 }],
  [{ page: '3', limit: '50' }, { page: 3, limit: 50, skip: 100 }],
  [{ page: '-1', limit: '1000' }, { page: 1, limit: 100, skip: 0 }],
  [{ page: '2junk', limit: '1.5' }, { page: 1, limit: 20, skip: 0 }],
  [{ page: ['2'], limit: { value: 10 } }, { page: 1, limit: 20, skip: 0 }]
])('pagination normalizes %j', (query, expected) => expect(pagination(query)).toEqual(expected));

test('unexpected production errors hide internal details and known HTTP errors keep their status', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const fixture = express();
  fixture.get('/internal', () => { throw new Error('private database credentials'); });
  fixture.get('/forbidden', () => { throw Object.assign(new Error('Không có quyền truy cập'), { statusCode: 403 }); });
  fixture.use(errorHandler);
  try {
    const internal = await request(fixture).get('/internal');
    expect(internal.status).toBe(500);
    expect(internal.body).toEqual({ success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau' });
    expect(internal.text).not.toMatch(/private|stack|credentials/);
    expect((await request(fixture).get('/forbidden')).status).toBe(403);
  } finally {
    process.env.NODE_ENV = previous;
  }
});

test('response helpers preserve the client envelope and integer VND', async () => {
  const fixture = express();
  fixture.get('/success', (req, res) => sendSuccess(res, 201, { amount: 10000 }, 'Thành công'));
  fixture.get('/error', (req, res) => sendError(res, 422, 'Dữ liệu không hợp lệ'));
  fixture.get('/list', (req, res) => sendPaginated(res, [], 1, 1000, 201));
  expect((await request(fixture).get('/success')).body).toEqual({ success: true, message: 'Thành công', data: { amount: 10000 } });
  expect((await request(fixture).get('/error')).status).toBe(422);
  expect((await request(fixture).get('/list')).body.pagination).toEqual({ page: 1, limit: 100, total: 201, totalPages: 3 });
});

test('unavailable order security dependencies return 503 without invoking business handlers', async () => {
  const response = await request(app).post('/api/orders/purchase-request').send({});
  expect(response.status).toBe(503);
  expect(response.body.success).toBe(false);
  const load = jest.fn();
  const fixture = express();
  fixture.use(availableRouter(() => false, load));
  await request(fixture).get('/');
  expect(load).not.toHaveBeenCalled();
});

test('an available router executes normally and forwards loader failures', async () => {
  const fixture = express();
  const router = express.Router();
  router.get('/', (req, res) => res.json({ ready: true }));
  fixture.use('/ready', availableRouter(() => true, () => router));
  fixture.use('/broken', availableRouter(() => true, () => { throw new Error('internal'); }));
  fixture.use(errorHandler);
  expect((await request(fixture).get('/ready')).body).toEqual({ ready: true });
  expect((await request(fixture).get('/broken')).status).toBe(500);
});

test('logger levels include the error-only level without falling back to info', () => {
  const sink = jest.fn();
  const log = createLogger({ level: 'error', sink });
  log.info('hidden');
  log.warn('hidden');
  log.debug('hidden');
  log.error('visible');
  expect(sink).toHaveBeenCalledTimes(1);
  expect(sink.mock.calls[0][0]).toMatchObject({ level: 'error', message: 'visible' });
});
