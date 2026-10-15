jest.mock('../src/modules/products/category.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ find: jest.fn() }));

const request = require('supertest');
const Category = require('../src/modules/products/category.model');
const Product = require('../src/modules/products/product.model');
const User = require('../src/modules/users/user.model');
const app = require('../src/app');

function makeProductQuery(products = []) {
  const query = {
    select: jest.fn(),
    populate: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn().mockResolvedValue(products)
  };
  for (const method of ['select', 'populate', 'sort', 'skip', 'limit']) {
    query[method].mockReturnValue(query);
  }
  return query;
}

function mockEligibleSellers(sellers = [{ _id: 'seller-1' }]) {
  const query = { select: jest.fn(), lean: jest.fn().mockResolvedValue(sellers) };
  query.select.mockReturnValue(query);
  User.find.mockReturnValue(query);
}

beforeEach(() => {
  jest.resetAllMocks();
  mockEligibleSellers();
  Product.find.mockReturnValue(makeProductQuery([{ _id: 'product-1', title: 'Used book' }]));
  Product.countDocuments.mockResolvedValue(21);
});

test('lists only active listings with the default page size and populated card summaries', async () => {
  const response = await request(app).get('/api/products');

  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({
    products: [{ _id: 'product-1', title: 'Used book' }],
    total: 21,
    page: 1,
    totalPages: 2,
    limit: 20
  });
  expect(Product.find).toHaveBeenCalledWith({
    status: 'active',
    seller: { $in: ['seller-1'] }
  });
  expect(Product.find.mock.results[0].value.populate).toHaveBeenCalledWith('seller', 'fullName avatar rating');
  expect(User.find).toHaveBeenCalledWith({
    isSuspended: { $ne: true },
    isSellingRestricted: { $ne: true }
  });
});

test('caps page size at 100 and applies category, price, city and sort filters', async () => {
  Category.findOne.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue({ _id: 'category-1' })
  });
  const response = await request(app).get('/api/products')
    .query({ category: 'books', minPrice: 100, maxPrice: 500, cities: ['Hà Nội', 'Đà Nẵng'], sort: 'price_asc', limit: 500 });

  expect(response.status).toBe(200);
  expect(response.body.data.limit).toBe(100);
  expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
    status: 'active',
    'location.city': { $in: ['Hà Nội', 'Đà Nẵng'] },
    price: { $gte: 100, $lte: 500 },
    $and: [{ $or: [{ category: 'category-1' }, { categories: 'category-1' }] }]
  }));
  expect(Product.find.mock.results[0].value.sort).toHaveBeenCalledWith({ price: 1, createdAt: -1 });
});

test.each([
  ['/api/products?search=book%20%24where%3A%20bad', 'book $where: bad'],
  ['/api/products/search?q=book', 'book']
])('uses the text index for the shared search path %s', async (path, search) => {
  const response = await request(app).get(path);

  expect(response.status).toBe(200);
  expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
    $text: { $search: search }
  }));
  expect(Product.find.mock.results[0].value.sort).toHaveBeenCalledWith({
    score: { $meta: 'textScore' },
    createdAt: -1
  });
});

test('unknown categories return an empty page without querying products', async () => {
  Category.findOne.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(null)
  });
  const response = await request(app).get('/api/products?category=not-a-category');

  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ products: [], total: 0, totalPages: 0 });
  expect(Product.find).not.toHaveBeenCalled();
});

test('invalid price ranges return a client error', async () => {
  const response = await request(app).get('/api/products?minPrice=500&maxPrice=100');
  expect(response.status).toBe(400);
  expect(response.body.message).toBe('Khoảng giá không hợp lệ');
});
