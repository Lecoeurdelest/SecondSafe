const express = require('express');
const request = require('supertest');
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
const User = require('../src/modules/users/user.model');
const { requireSellerCanSell } = require('../src/common/middlewares/seller-restriction.middleware');

function app(userId) {
  const fixture = express();
  fixture.use((req, res, next) => { if (userId) req.user = { userId }; next(); });
  fixture.post('/seller-action', requireSellerCanSell, (req, res) => res.sendStatus(204));
  return fixture;
}

beforeEach(() => jest.clearAllMocks());

test('seller actions reject missing authentication without database work', async () => {
  expect((await request(app()).post('/seller-action')).status).toBe(401);
  expect(User.findById).not.toHaveBeenCalled();
});

test('seller actions reject deleted accounts and active restrictions', async () => {
  User.findById.mockResolvedValueOnce(null).mockResolvedValueOnce({ isSellingRestricted: true });
  expect((await request(app('seller')).post('/seller-action')).status).toBe(401);
  expect((await request(app('seller')).post('/seller-action')).status).toBe(403);
});

test('seller actions allow unrestricted accounts and clear expired restrictions', async () => {
  const expired = { isSellingRestricted: true, sellingRestrictedUntil: new Date(Date.now() - 60000), save: jest.fn() };
  User.findById.mockResolvedValueOnce({ isSellingRestricted: false }).mockResolvedValueOnce(expired);
  expect((await request(app('seller')).post('/seller-action')).status).toBe(204);
  expect((await request(app('seller')).post('/seller-action')).status).toBe(204);
  expect(expired.save).toHaveBeenCalledTimes(1);
  expect(expired.isSellingRestricted).toBe(false);
});
