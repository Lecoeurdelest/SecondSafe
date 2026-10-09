jest.mock('../src/modules/products/category.model', () => ({ find: jest.fn(), findOne: jest.fn() }));
const request = require('supertest');
const Category = require('../src/modules/products/category.model');
const app = require('../src/app');

beforeEach(() => jest.resetAllMocks());

test('lists public active categories with name ordering and baseline field projection', async () => {
  const data = [{ _id: 'category', name: 'Books', slug: 'books', description: 'Books', icon: 'book' }];
  const query = { select: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(data) };
  Category.find.mockReturnValue(query);
  const response = await request(app).get('/api/categories');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ success: true, data });
  expect(Category.find).toHaveBeenCalledWith({ isActive: true });
  expect(query.sort).toHaveBeenCalledWith({ name: 1 });
  expect(query.select).toHaveBeenCalledWith('name slug description icon');
});

test('empty category list returns an empty array', async () => {
  const query = { select: () => query, sort: () => query, lean: async () => [] };
  Category.find.mockReturnValue(query);
  const response = await request(app).get('/api/categories');
  expect(response.status).toBe(200);
  expect(response.body.data).toEqual([]);
});

test('gets an active category by its literal slug', async () => {
  Category.findOne.mockReturnValue({ lean: async () => ({ name: 'Books', slug: 'books', isActive: true }) });
  const response = await request(app).get('/api/categories/books');
  expect(response.status).toBe(200);
  expect(Category.findOne).toHaveBeenCalledWith({ slug: 'books', isActive: true });
  expect(response.body.data.slug).toBe('books');
});

test.each(['missing', 'inactive'])('%s slug returns Vietnamese 404', async slug => {
  Category.findOne.mockReturnValue({ lean: async () => null });
  const response = await request(app).get(`/api/categories/${slug}`);
  expect(response.status).toBe(404);
  expect(response.body).toEqual({ success: false, message: 'Danh mục không tồn tại' });
  expect(Category.findOne).toHaveBeenCalledWith({ slug, isActive: true });
});

test('database failures propagate as a safe 500', async () => {
  Category.findOne.mockReturnValue({ lean: async () => { throw new Error('private database detail'); } });
  const response = await request(app).get('/api/categories/books');
  expect(response.status).toBe(500);
  expect(response.body.message).toBe('Lỗi hệ thống, vui lòng thử lại sau');
  expect(JSON.stringify(response.body)).not.toContain('database');
});
