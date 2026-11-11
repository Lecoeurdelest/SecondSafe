jest.mock('../src/modules/products/category.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ find: jest.fn(), findOne: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/modules/orders/order.model', () => ({ aggregate: jest.fn(), exists: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ find: jest.fn(), findById: jest.fn() }));

const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const User = require('../src/modules/users/user.model');
const productService = require('../src/modules/products/product.service');
const managementService = require('../src/modules/products/product-management.service');

const sellerId = '507f1f77bcf86cd799439011';
const otherSellerId = '507f1f77bcf86cd799439012';
const productId = '507f1f77bcf86cd799439013';

function chain(value) {
  const query = { lean: jest.fn().mockResolvedValue(value) };
  for (const method of ['select', 'populate', 'sort', 'skip', 'limit']) query[method] = jest.fn(() => query);
  return query;
}

function eligibleSellers(ids) {
  User.find.mockReturnValue(chain(ids.map(_id => ({ _id }))));
}

beforeEach(() => {
  jest.resetAllMocks();
  eligibleSellers([sellerId, otherSellerId]);
  Product.find.mockReturnValue(chain([{ _id: productId }]));
  Product.countDocuments.mockResolvedValue(1);
});

test('my listings filter by status, paginate and flag listings with an open order (AC-PROD-06-1)', async () => {
  Order.aggregate.mockResolvedValue([{ _id: productId, count: 1 }]);

  const result = await managementService.getMyProducts(sellerId, { status: 'hidden', limit: '500' });

  expect(Product.find).toHaveBeenCalledWith({ seller: sellerId, status: 'hidden' });
  expect(result).toMatchObject({ page: 1, limit: 100, total: 1 });
  expect(result.products[0]).toMatchObject({ activeOrderCount: 1, isInActiveOrder: true });
});

test('my listings default to twenty per page and leave out deleted listings', async () => {
  Order.aggregate.mockResolvedValue([]);

  const result = await managementService.getMyProducts(sellerId, { status: { $ne: null } });

  expect(Product.find).toHaveBeenCalledWith({ seller: sellerId, status: { $ne: 'deleted' } });
  expect(result).toMatchObject({ limit: 20 });
  expect(result.products[0]).toMatchObject({ activeOrderCount: 0, isInActiveOrder: false });
});

test('the public list can be narrowed to one eligible seller', async () => {
  await productService.listProducts({ seller: sellerId });
  expect(Product.find.mock.calls[0][0].seller).toEqual({ $in: [sellerId] });
});

test('an unknown, malformed or suspended seller yields an empty list', async () => {
  for (const seller of ['507f1f77bcf86cd799439099', 'not-an-id', { $ne: null }]) {
    expect(await productService.listProducts({ seller })).toMatchObject({ products: [], total: 0 });
  }
  expect(Product.find).not.toHaveBeenCalled();
});

test('the owner can open their own hidden listing; others see only active listings (AC-PROD-07-1)', async () => {
  Product.findOne.mockReturnValueOnce(chain({ _id: productId, status: 'hidden', seller: { _id: sellerId, fullName: 'Người bán' } }));
  const own = await productService.getProductById(productId, sellerId);
  expect(own.status).toBe('hidden');
  expect(Product.findOne).toHaveBeenCalledWith({ _id: productId, seller: sellerId, status: { $ne: 'deleted' } });

  Product.findOne.mockReset();
  Product.findOne.mockReturnValueOnce(chain(null)).mockReturnValueOnce(chain({ _id: productId, status: 'active', seller: { fullName: 'Người bán' } }));
  const visible = await productService.getProductById(productId, otherSellerId);
  expect(visible.seller.fullName).toBe('Người bán');
  expect(Product.findOne).toHaveBeenLastCalledWith({ _id: productId, status: 'active', seller: { $in: [sellerId, otherSellerId] } });
});

test('a listing whose seller is suspended or deleted is not found (AC-PROD-07-1)', async () => {
  eligibleSellers([]);
  await expect(productService.getProductById(productId)).rejects.toMatchObject({ statusCode: 404 });

  eligibleSellers([otherSellerId]);
  Product.findOne.mockReturnValue(chain(null));
  await expect(productService.getProductById(productId)).rejects.toMatchObject({ statusCode: 404 });
  await expect(productService.getProductById('not-an-id')).rejects.toMatchObject({ statusCode: 404 });
});
