jest.mock('../src/modules/products/product.model', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn()
}));

const Product = require('../src/modules/products/product.model');
const adminProductService = require('../src/modules/products/admin-product.service');

function productQuery(products = []) {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    skip: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue(products)
  };
  return query;
}

beforeEach(() => jest.clearAllMocks());

test('lists all product states with search and pagination', async () => {
  const query = productQuery([{ _id: 'product-1', title: 'Used book' }]);
  Product.find.mockReturnValue(query);
  Product.countDocuments.mockResolvedValue(1);

  const result = await adminProductService.listProducts({ search: 'book', status: 'hidden', page: '2', limit: '10' });

  expect(Product.find).toHaveBeenCalledWith({
    status: 'hidden',
    title: { $regex: 'book', $options: 'i' }
  });
  expect(query.skip).toHaveBeenCalledWith(10);
  expect(query.limit).toHaveBeenCalledWith(10);
  expect(result).toMatchObject({ products: [{ title: 'Used book' }], total: 1, page: 2, totalPages: 1, limit: 10 });
});

test('rejects invalid status filters and search patterns are treated literally', async () => {
  await expect(adminProductService.listProducts({ status: 'arbitrary' }))
    .rejects.toMatchObject({ statusCode: 400 });
  Product.find.mockReturnValue(productQuery());
  Product.countDocuments.mockResolvedValue(0);

  await adminProductService.listProducts({ search: 'book.*' });

  expect(Product.find).toHaveBeenCalledWith({ title: { $regex: 'book\\.\\*', $options: 'i' } });
});

test('hides active products and restores only hidden products', async () => {
  const active = { _id: '507f1f77bcf86cd799439011', status: 'active', save: jest.fn().mockResolvedValue(undefined) };
  Product.findById.mockResolvedValueOnce(active);

  await adminProductService.updateVisibility(active._id, 'hidden');

  expect(active.status).toBe('hidden');
  expect(active.save).toHaveBeenCalledTimes(1);

  const sold = { _id: active._id, status: 'sold', save: jest.fn() };
  Product.findById.mockResolvedValueOnce(sold);
  await expect(adminProductService.updateVisibility(sold._id, 'hidden')).rejects.toMatchObject({ statusCode: 409 });
  expect(sold.save).not.toHaveBeenCalled();

  const hidden = { _id: active._id, status: 'hidden', save: jest.fn().mockResolvedValue(undefined) };
  Product.findById.mockResolvedValueOnce(hidden);
  await adminProductService.updateVisibility(hidden._id, 'active');
  expect(hidden.status).toBe('active');
});
