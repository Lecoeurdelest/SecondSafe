jest.mock('../src/modules/products/category.model', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => {
  const Product = jest.fn(function Product(data) {
    Object.assign(this, data, { _id: 'new-product' });
    this.save = jest.fn().mockResolvedValue(this);
    this.populate = jest.fn().mockResolvedValue(this);
  });
  Product.findById = jest.fn();
  Product.find = jest.fn();
  Product.countDocuments = jest.fn();
  return Product;
});
jest.mock('../src/modules/orders/order.model', () => ({ exists: jest.fn(), aggregate: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));

const Category = require('../src/modules/products/category.model');
const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const User = require('../src/modules/users/user.model');
const service = require('../src/modules/products/product-management.service');

const sellerId = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';
const categoryId = '507f1f77bcf86cd799439013';

const listing = {
  title: 'Sách cũ',
  description: 'Còn mới 90%',
  price: 120000,
  condition: 'good',
  images: ['/uploads/products/temp/a.jpg'],
  location: { city: 'Hà Nội', district: 'Cầu Giấy' },
  category: categoryId
};

function categoryQuery(category) {
  const query = { select: jest.fn(), lean: jest.fn().mockResolvedValue(category) };
  query.select.mockReturnValue(query);
  return query;
}

function storedProduct(overrides = {}) {
  const product = { _id: productId, seller: sellerId, status: 'active', ...overrides };
  product.set = jest.fn(changes => Object.assign(product, changes));
  product.save = jest.fn().mockResolvedValue(product);
  product.populate = jest.fn().mockResolvedValue(product);
  return product;
}

beforeEach(() => {
  jest.clearAllMocks();
  User.findById.mockResolvedValue({ _id: sellerId, isSellingRestricted: false });
  Category.findOne.mockReturnValue(categoryQuery({ _id: categoryId }));
  Order.exists.mockResolvedValue(null);
});

test('creates an active listing owned by the caller with its category in the category list', async () => {
  const product = await service.createProduct(sellerId, { ...listing, status: 'sold', seller: 'someone-else' });

  expect(product).toMatchObject({
    title: 'Sách cũ', price: 120000, seller: sellerId, status: 'active', category: categoryId, categories: [categoryId]
  });
  expect(product.save).toHaveBeenCalled();
});

test.each([
  ['a fractional price', { price: 1200.5 }, 'Giá bán phải là số nguyên không âm (VND)'],
  ['a negative price', { price: -1 }, 'Giá bán phải là số nguyên không âm (VND)'],
  ['a missing title', { title: ' ' }, 'Tiêu đề phải có từ 1 đến 200 ký tự'],
  ['a title over 200 characters', { title: 'a'.repeat(201) }, 'Tiêu đề phải có từ 1 đến 200 ký tự'],
  ['a description over 2000 characters', { description: 'a'.repeat(2001) }, 'Mô tả phải có từ 1 đến 2000 ký tự'],
  ['an other-category label over 100 characters', { otherCategory: 'a'.repeat(101) }, 'Danh mục khác không được vượt quá 100 ký tự'],
  ['no images', { images: [] }, 'Vui lòng tải lên ít nhất 1 ảnh'],
  ['an unknown condition', { condition: 'broken' }, 'Tình trạng sản phẩm không hợp lệ'],
  ['an incomplete location', { location: { city: 'Hà Nội' } }, 'Vui lòng nhập đầy đủ địa chỉ (tỉnh/thành phố và quận/huyện)']
])('rejects a listing with %s', async (name, overrides, message) => {
  await expect(service.createProduct(sellerId, { ...listing, ...overrides })).rejects.toMatchObject({ statusCode: 400, message });
  expect(Product).not.toHaveBeenCalled();
});

test('rejects an unknown category and a listing without any category', async () => {
  Category.findOne.mockReturnValue(categoryQuery(null));
  await expect(service.createProduct(sellerId, listing)).rejects.toMatchObject({ statusCode: 400, message: 'Danh mục không hợp lệ' });
  await expect(service.createProduct(sellerId, { ...listing, category: undefined }))
    .rejects.toMatchObject({ statusCode: 400, message: 'Vui lòng chọn danh mục' });
});

test('a seller under selling restriction cannot publish (INV-03)', async () => {
  User.findById.mockResolvedValue({ _id: sellerId, isSellingRestricted: true, sellingRestrictedReason: 'Vi phạm' });
  await expect(service.createProduct(sellerId, listing)).rejects.toMatchObject({ statusCode: 403 });
});

test('only the owner can edit, and only the editable fields change', async () => {
  const product = storedProduct();
  Product.findById.mockResolvedValue(product);

  await expect(service.updateProduct(productId, '507f1f77bcf86cd799439099', { price: 1 })).rejects.toMatchObject({ statusCode: 403 });

  await service.updateProduct(productId, sellerId, { price: 99000, status: 'sold', seller: 'x', views: 5 });
  expect(product.set).toHaveBeenCalledWith({ price: 99000 });
});

test.each([
  ['sold', {}],
  ['pending', {}],
  ['active', { order: true }]
])('a %s listing tied to a sale is read-only (INV-02)', async (status, { order }) => {
  Product.findById.mockResolvedValue(storedProduct({ status }));
  Order.exists.mockResolvedValue(order ? { _id: 'order' } : null);

  await expect(service.updateProduct(productId, sellerId, { price: 5000 })).rejects.toMatchObject({ statusCode: 403 });
  await expect(service.deleteProduct(productId, sellerId)).rejects.toMatchObject({ statusCode: 403 });
  await expect(service.setProductVisibility(productId, sellerId, 'hidden')).rejects.toMatchObject({ statusCode: 403 });
});

test('delete is a soft delete and a deleted listing can no longer be found', async () => {
  const product = storedProduct();
  Product.findById.mockResolvedValue(product);
  await service.deleteProduct(productId, sellerId);
  expect(product.status).toBe('deleted');

  await expect(service.updateProduct(productId, sellerId, { price: 5000 })).rejects.toMatchObject({ statusCode: 404 });
});

test('visibility toggles between active and hidden only, and a restricted seller cannot re-activate', async () => {
  const product = storedProduct();
  Product.findById.mockResolvedValue(product);

  await service.setProductVisibility(productId, sellerId, 'hidden');
  expect(product.status).toBe('hidden');
  await expect(service.setProductVisibility(productId, sellerId, 'sold')).rejects.toMatchObject({ statusCode: 400 });

  User.findById.mockResolvedValue({ _id: sellerId, isSellingRestricted: true });
  await expect(service.setProductVisibility(productId, sellerId, 'active')).rejects.toMatchObject({ statusCode: 403 });
  expect(product.status).toBe('hidden');
});

test('a free listing and an other-category label of 100 characters are accepted', async () => {
  const product = await service.createProduct(sellerId, { ...listing, price: 0, otherCategory: 'a'.repeat(100) });
  expect(product).toMatchObject({ price: 0, status: 'active' });
  expect(product.otherCategory).toHaveLength(100);
});
