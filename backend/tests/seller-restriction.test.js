const express = require('express');
const request = require('supertest');
const { requireSellerCanSell } = require('../src/common/middlewares/seller-restriction.middleware');

test('seller actions fail closed while the restriction service is unavailable', async () => {
  const app = express();
  app.post('/seller-action', requireSellerCanSell, (req, res) => res.sendStatus(204));

  const response = await request(app).post('/seller-action');

  expect(response.status).toBe(503);
  expect(response.body).toEqual({
    success: false,
    message: 'Chức năng đang được hoàn thiện, vui lòng thử lại sau'
  });
});
