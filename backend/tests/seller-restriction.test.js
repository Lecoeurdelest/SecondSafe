const express = require('express');
const request = require('supertest');
const { requireSellerCanSell } = require('../src/common/middlewares/seller-restriction.middleware');

test('seller actions require an authenticated user', async () => {
  const app = express();
  app.post('/seller-action', requireSellerCanSell, (req, res) => res.sendStatus(204));

  const response = await request(app).post('/seller-action');

  expect(response.status).toBe(401);
  expect(response.body).toEqual({
    success: false,
    message: 'Vui lòng đăng nhập'
  });
});
