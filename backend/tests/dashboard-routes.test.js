let mockRole = 'user';
jest.mock('../src/common/middlewares/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: mockRole };
    next();
  })
}));
jest.mock('../src/modules/users/admin-dashboard.service', () => ({
  getDashboard: jest.fn()
}));
jest.mock('../src/modules/moderator/moderator.dashboard.service', () => ({
  getDashboard: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../src/common/middlewares/error.middleware');
const userRouter = require('../src/modules/users/user.route');
const moderatorRouter = require('../src/modules/moderator/moderator.route');
const adminDashboard = require('../src/modules/users/admin-dashboard.service');
const moderatorDashboard = require('../src/modules/moderator/moderator.dashboard.service');

beforeEach(() => {
  mockRole = 'user';
  adminDashboard.getDashboard.mockReset();
  moderatorDashboard.getDashboard.mockReset();
});

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/users', userRouter);
  instance.use('/api/moderator', moderatorRouter);
  instance.use(errorHandler);
  return instance;
}

test('admin and staff dashboard routes enforce their role boundary', async () => {
  mockRole = 'user';
  expect((await request(app()).get('/api/users/admin/dashboard')).status).toBe(403);
  expect((await request(app()).get('/api/moderator/dashboard')).status).toBe(403);

  mockRole = 'moderator';
  expect((await request(app()).get('/api/users/admin/dashboard')).status).toBe(403);
  moderatorDashboard.getDashboard.mockResolvedValue({ openDisputes: 1 });
  expect((await request(app()).get('/api/moderator/dashboard')).status).toBe(200);

  mockRole = 'admin';
  adminDashboard.getDashboard.mockResolvedValue({ users: { total: 3 } });
  expect((await request(app()).get('/api/users/admin/dashboard')).status).toBe(200);
  moderatorDashboard.getDashboard.mockResolvedValue({ openDisputes: 0 });
  expect((await request(app()).get('/api/moderator/dashboard')).status).toBe(200);
});

test('admin dashboard returns aggregate metrics without raw account fields', async () => {
  mockRole = 'admin';
  adminDashboard.getDashboard.mockResolvedValue({
    users: { total: 2, byRole: { admin: 1, user: 1 }, byStatus: { active: 2 } },
    products: { total: 0, byStatus: {}, byCategory: [] },
    orders: { total: 0, byStatus: {}, valueVnd: 0, monthly: [] },
    purchaseRequests: { total: 0, byStatus: {} },
    reports: { total: 0, byStatus: {} },
    disputes: { total: 0, byStatus: {} },
    transactions: { total: 0, byType: {}, feeRevenueVnd: 0 },
    wallets: { total: 0, balanceVnd: 0 },
    reviews: { total: 0, averageRating: 0 },
    deliveries: { total: 0, byStatus: {} }
  });

  const response = await request(app()).get('/api/users/admin/dashboard');

  expect(response.status).toBe(200);
  expect(response.body.data.users.total).toBe(2);
  expect(response.body.data.users).not.toHaveProperty('email');
  expect(JSON.stringify(response.body)).not.toContain('passwordHash');
});

test('staff dashboard returns operational workload without financial data', async () => {
  mockRole = 'moderator';
  moderatorDashboard.getDashboard.mockResolvedValue({
    openDisputes: 1,
    pendingPurchaseRequests: 2,
    openOrders: 3,
    activeDeliveries: 1
  });

  const response = await request(app()).get('/api/moderator/dashboard');

  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ openDisputes: 1, pendingPurchaseRequests: 2, activeDeliveries: 1 });
  expect(response.body.data).not.toHaveProperty('wallets');
  expect(response.body.data).not.toHaveProperty('transactions');
});
