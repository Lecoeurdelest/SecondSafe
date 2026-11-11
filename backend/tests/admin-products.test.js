let mockRole = 'user';
jest.mock('../src/common/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: mockRole };
    next();
  }
}));
jest.mock('../src/modules/products/admin-product.service', () => ({
  listProducts: jest.fn(),
  updateVisibility: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../src/common/middlewares/error.middleware');
const productRouter = require('../src/modules/products/product.route');
const adminProductService = require('../src/modules/products/admin-product.service');

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/products', productRouter);
  instance.use(errorHandler);
  return instance;
}

beforeEach(() => {
  mockRole = 'user';
  jest.clearAllMocks();
});

test('only admins can list products in the management route', async () => {
  adminProductService.listProducts.mockResolvedValue({
    products: [{ _id: 'product-1', title: 'Sách cũ' }],
    total: 1,
    page: 1,
    totalPages: 1,
    limit: 20
  });

  expect((await request(app()).get('/api/products/admin')).status).toBe(403);
  expect(adminProductService.listProducts).not.toHaveBeenCalled();

  mockRole = 'admin';
  const response = await request(app()).get('/api/products/admin').query({ status: 'hidden' });

  expect(response.status).toBe(200);
  expect(response.body.data.products[0].title).toBe('Sách cũ');
  expect(adminProductService.listProducts).toHaveBeenCalledWith(expect.objectContaining({ status: 'hidden' }));
});

test('only admins can change product visibility', async () => {
  mockRole = 'moderator';
  expect((await request(app()).patch('/api/products/admin/507f1f77bcf86cd799439012/status').send({ status: 'hidden' })).status).toBe(403);
  expect(adminProductService.updateVisibility).not.toHaveBeenCalled();

  mockRole = 'admin';
  adminProductService.updateVisibility.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', status: 'hidden' });
  const response = await request(app())
    .patch('/api/products/admin/507f1f77bcf86cd799439012/status')
    .send({ status: 'hidden' });

  expect(response.status).toBe(200);
  expect(adminProductService.updateVisibility).toHaveBeenCalledWith('507f1f77bcf86cd799439012', 'hidden');
});
