jest.mock('../src/modules/products/category.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../src/modules/orders/order.model', () => ({ exists: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));

const Category = require('../src/modules/products/category.model');
const Order = require('../src/modules/orders/order.model');
const Product = require('../src/modules/products/product.model');
const productService = require('../src/modules/products/product.service');

const PRODUCT_ID = '507f1f77bcf86cd799439011';
const CATEGORY_ID = '507f1f77bcf86cd799439012';

function makeProduct(status = 'active') {
  return {
    _id: PRODUCT_ID,
    title: 'Sách cũ',
    description: 'Mô tả cũ',
    price: 50000,
    condition: 'good',
    category: CATEGORY_ID,
    images: ['/uploads/products/seller1/book.jpg'],
    seller: '507f1f77bcf86cd799439013',
    status,
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    save: jest.fn().mockResolvedValue(undefined)
  };
}

function makePayload(overrides = {}) {
  return {
    title: 'Sách đã sửa',
    description: 'Mô tả đã sửa',
    price: 60000,
    condition: 'like-new',
    category: CATEGORY_ID,
    images: ['/uploads/products/seller1/book.jpg'],
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    ...overrides
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  Order.exists.mockResolvedValue(false);
  Category.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: CATEGORY_ID })
  });
});

test('admin can update listing content without changing ownership or status', async () => {
  const product = makeProduct('hidden');
  Product.findById.mockResolvedValue(product);

  const result = await productService.updateProductAsAdmin(PRODUCT_ID, makePayload());

  expect(result).toBe(product);
  expect(product).toMatchObject({
    title: 'Sách đã sửa',
    description: 'Mô tả đã sửa',
    price: 60000,
    condition: 'like-new',
    category: CATEGORY_ID,
    status: 'hidden',
    seller: '507f1f77bcf86cd799439013',
    location: { city: 'Hà Nội', district: 'Ba Đình' }
  });
  expect(product.save).toHaveBeenCalledTimes(1);
});

test.each(['sold', 'expired', 'deleted'])('admin cannot edit a %s product', async status => {
  const product = makeProduct(status);
  Product.findById.mockResolvedValue(product);

  await expect(productService.updateProductAsAdmin(PRODUCT_ID, makePayload()))
    .rejects.toMatchObject({ statusCode: 409 });
  expect(product.save).not.toHaveBeenCalled();
});

test('admin cannot edit a product with an open order or submit an invalid price', async () => {
  const product = makeProduct();
  Product.findById.mockResolvedValue(product);
  Order.exists.mockResolvedValue({ _id: 'open-order' });

  await expect(productService.updateProductAsAdmin(PRODUCT_ID, makePayload()))
    .rejects.toMatchObject({ statusCode: 409 });
  expect(product.save).not.toHaveBeenCalled();

  Order.exists.mockResolvedValue(false);
  await expect(productService.updateProductAsAdmin(PRODUCT_ID, makePayload({ price: 12.5 })))
    .rejects.toMatchObject({ statusCode: 400 });
  expect(product.save).not.toHaveBeenCalled();
});
