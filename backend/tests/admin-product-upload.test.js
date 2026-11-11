let mockRole = 'user';
jest.mock('../src/common/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: '507f1f77bcf86cd799439014', role: mockRole };
    next();
  }
}));

const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../src/common/middlewares/error.middleware');
const uploadRouter = require('../src/modules/products/upload.route');

const uploadedDirectory = path.join(__dirname, '../uploads/products/507f1f77bcf86cd799439014');
let uploadedFile;

function app() {
  const instance = express();
  instance.use('/api/upload', uploadRouter);
  instance.use(errorHandler);
  return instance;
}

afterAll(() => {
  if (uploadedFile && fs.existsSync(uploadedFile)) fs.unlinkSync(uploadedFile);
  if (fs.existsSync(uploadedDirectory) && fs.readdirSync(uploadedDirectory).length === 0) {
    fs.rmdirSync(uploadedDirectory);
  }
});

test('only admins can upload product images for listing edits', async () => {
  mockRole = 'user';
  expect((await request(app()).post('/api/upload/admin-product')).status).toBe(403);

  mockRole = 'admin';
  const response = await request(app())
    .post('/api/upload/admin-product')
    .attach('images', Buffer.from('test image'), { filename: 'product.jpg', contentType: 'image/jpeg' });

  expect(response.status).toBe(200);
  expect(response.body.data.imageUrls).toHaveLength(1);
  uploadedFile = path.join(uploadedDirectory, path.basename(response.body.data.imageUrls[0]));
  expect(fs.existsSync(uploadedFile)).toBe(true);
});
