const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'guard-test-secret';
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
const User = require('../src/modules/users/user.model');
const { generateJWT, verifyToken } = require('../src/common/utils/jwt.util');
const { authenticate, optionalAuthenticate } = require('../src/common/middlewares/auth.middleware');
const { requireRole } = require('../src/common/middlewares/role.middleware');
const { requireAdmin } = require('../src/common/middlewares/admin.middleware');
const { errorHandler } = require('../src/common/middlewares/error.middleware');
const logger = require('../src/common/utils/logger.util');

const userId = '507f1f77bcf86cd799439011';
let select;
let lean;

function app() {
  const fixture = express();
  fixture.get('/protected', authenticate, (req, res) => res.json(req.user));
  fixture.get('/moderator', authenticate, requireRole('moderator'), (req, res) => res.sendStatus(204));
  fixture.get('/admin', authenticate, requireAdmin, (req, res) => res.sendStatus(204));
  fixture.get('/optional', optionalAuthenticate, (req, res) => res.json({ role: req.user?.role || 'guest' }));
  fixture.get('/unguarded-role', requireAdmin, (req, res) => res.sendStatus(204));
  fixture.use(errorHandler);
  return fixture;
}

beforeEach(() => {
  process.env.JWT_SECRET = 'guard-test-secret';
  lean = jest.fn().mockResolvedValue({ _id: userId, email: 'user@example.test', fullName: 'Test User', role: 'user', password: 'must-not-leave-service' });
  select = jest.fn().mockReturnValue({ lean });
  User.findById.mockReturnValue({ select });
  jest.spyOn(logger, 'error').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); User.findById.mockReset(); });

test.each([undefined, '', 'Basic abc', 'Bearer invalid', 'Bearer token extra'])('protected routes reject malformed/missing authorization %s', async header => {
  const call = request(app()).get('/protected');
  if (header !== undefined) call.set('Authorization', header);
  expect((await call).status).toBe(401);
  expect(User.findById).not.toHaveBeenCalled();
});

test('a signed token resolves the current database role and excludes credentials', async () => {
  const token = jwt.sign({ userId, role: 'admin', password: 'untrusted-payload' }, process.env.JWT_SECRET, { expiresIn: 60 });
  const response = await request(app()).get('/protected').set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({ userId, role: 'user' });
  expect(response.body).not.toHaveProperty('password');
  expect(select.mock.calls[0][0].split(' ')).not.toContain('password');
});

test.each([
  ['user', '/moderator', 403], ['user', '/admin', 403],
  ['moderator', '/moderator', 204], ['moderator', '/admin', 403],
  ['admin', '/moderator', 204], ['admin', '/admin', 204]
])('%s access to %s returns %i', async (role, path, status) => {
  lean.mockResolvedValue({ _id: userId, role });
  const response = await request(app()).get(path).set('Authorization', `Bearer ${generateJWT({ userId })}`);
  expect(response.status).toBe(status);
});

test('role guards reject missing authentication state', async () => {
  expect((await request(app()).get('/unguarded-role')).status).toBe(401);
});

test('JWT expiry, signature, algorithm and subject are enforced', () => {
  expect(() => verifyToken(generateJWT({ userId }, -1))).toThrow('Token đã hết hạn');
  expect(() => verifyToken(jwt.sign({ userId }, 'wrong-secret'))).toThrow('Token không hợp lệ');
  expect(() => verifyToken(jwt.sign({ userId }, process.env.JWT_SECRET, { algorithm: 'HS384' }))).toThrow('Token không hợp lệ');
  expect(() => verifyToken(jwt.sign({ userId: 'not-an-id' }, process.env.JWT_SECRET))).toThrow('Token không hợp lệ');
  expect(() => verifyToken(jwt.sign({ other: 'payload' }, process.env.JWT_SECRET))).toThrow('Token không hợp lệ');
  expect(() => verifyToken(jwt.sign({ userId }, process.env.JWT_SECRET))).toThrow('Token không hợp lệ');
  expect(() => verifyToken(jwt.sign({ userId: [userId] }, process.env.JWT_SECRET, { expiresIn: 60 }))).toThrow('Token không hợp lệ');
});

test('new tokens use the configured lifetime and contain only the user identifier', () => {
  const business = require('../src/config/business');
  const decoded = verifyToken(generateJWT({ userId, email: 'private@example.test', role: 'admin', password: 'private' }));
  expect(decoded.exp - decoded.iat).toBe(business.jwtTtlSeconds);
  expect(Object.keys(decoded).sort()).toEqual(['exp', 'iat', 'userId']);
});

test('deleted accounts and unknown database roles cannot authenticate', async () => {
  for (const value of [null, { _id: userId, role: 'root' }]) {
    lean.mockResolvedValue(value);
    expect((await request(app()).get('/protected').set('Authorization', `Bearer ${generateJWT({ userId })}`)).status).toBe(401);
  }
});

test('optional authentication allows guests and invalid tokens but enriches a valid session', async () => {
  expect((await request(app()).get('/optional')).body.role).toBe('guest');
  expect((await request(app()).get('/optional').set('Authorization', 'Bearer invalid')).body.role).toBe('guest');
  expect((await request(app()).get('/optional').set('Authorization', `bearer ${generateJWT({ userId })}`)).body.role).toBe('user');
});

test('database failures fail closed for required and optional authentication', async () => {
  lean.mockRejectedValue(new Error('private database failure'));
  for (const path of ['/protected', '/optional']) {
    const response = await request(app()).get(path).set('Authorization', `Bearer ${generateJWT({ userId })}`);
    expect(response.status).toBe(500);
    expect(response.text).not.toContain('private database failure');
  }
});

test('missing signing configuration does not create or accept tokens', () => {
  delete process.env.JWT_SECRET;
  expect(() => generateJWT({ userId })).toThrow('Missing JWT_SECRET');
  expect(() => verifyToken('some-token')).toThrow('Missing JWT_SECRET');
});
