jest.mock('../src/modules/users/favorite.model', () => ({
  updateOne: jest.fn(),
  findOne: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
  exists: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../src/modules/users/cart-item.model', () => ({
  updateOne: jest.fn(),
  findOne: jest.fn(),
  deleteOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../src/modules/products/product.model', () => ({
  findById: jest.fn(),
  find: jest.fn()
}));
jest.mock('../src/modules/products/product-availability.service', () => ({
  getEligibleProductIds: jest.fn()
}));

const Favorite = require('../src/modules/users/favorite.model');
const CartItem = require('../src/modules/users/cart-item.model');
const Product = require('../src/modules/products/product.model');
const { getEligibleProductIds } = require('../src/modules/products/product-availability.service');
const favoriteService = require('../src/modules/users/favorite.service');
const cartService = require('../src/modules/users/cart.service');

const buyerId = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';

function populatedQuery(value) {
  const query = {
    populate: jest.fn(),
    lean: jest.fn().mockResolvedValue(value)
  };
  query.populate.mockReturnValue(query);
  return query;
}

beforeEach(() => {
  jest.resetAllMocks();
  getEligibleProductIds.mockResolvedValue([productId]);
  Favorite.updateOne.mockResolvedValue({ upsertedCount: 1 });
  Favorite.findOne.mockReturnValue(populatedQuery({ product: { _id: productId } }));
  CartItem.updateOne.mockResolvedValue({ upsertedCount: 1 });
  CartItem.findOne.mockReturnValue(populatedQuery({ product: { _id: productId } }));
  Product.findById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ seller: '507f1f77bcf86cd799439013' })
    })
  });
});

test('adding favorites is idempotent and only accepts active eligible products', async () => {
  const result = await favoriteService.add(buyerId, productId);

  expect(result).toEqual({ product: { _id: productId } });
  expect(Favorite.updateOne).toHaveBeenCalledWith(
    { user: buyerId, product: productId },
    { $setOnInsert: { user: buyerId, product: productId } },
    { upsert: true }
  );
  expect(getEligibleProductIds).toHaveBeenCalledWith(productId);
});

test('favorite checks and removals are scoped to the current user', async () => {
  Favorite.exists.mockResolvedValue({ _id: 'favorite-1' });
  expect(await favoriteService.check(buyerId, productId)).toEqual({ productId, isFavorite: true });
  await favoriteService.remove(buyerId, productId);
  expect(Favorite.deleteOne).toHaveBeenCalledWith({ user: buyerId, product: productId });
});

test('cart additions are idempotent and reject a seller adding their own listing', async () => {
  await cartService.add(buyerId, productId);
  expect(CartItem.updateOne).toHaveBeenCalledWith(
    { user: buyerId, product: productId },
    { $setOnInsert: { user: buyerId, product: productId } },
    { upsert: true }
  );

  Product.findById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ seller: buyerId })
    })
  });
  await expect(cartService.add(buyerId, productId)).rejects.toMatchObject({ statusCode: 400 });
});

test('invalid product identifiers are rejected before database access', async () => {
  await expect(cartService.add(buyerId, 'invalid')).rejects.toMatchObject({ statusCode: 400 });
  await expect(favoriteService.add(buyerId, 'invalid')).rejects.toMatchObject({ statusCode: 400 });
  expect(getEligibleProductIds).not.toHaveBeenCalled();
});

test('cart listing filters unavailable products and applies bounded pagination', async () => {
  const query = {
    populate: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn().mockResolvedValue([{ product: { _id: productId } }])
  };
  for (const method of ['populate', 'sort', 'skip', 'limit']) {
    query[method].mockReturnValue(query);
  }
  Product.find.mockReturnValue({
    distinct: jest.fn().mockResolvedValue([productId])
  });
  CartItem.find.mockReturnValue(query);
  CartItem.countDocuments.mockResolvedValue(21);

  const result = await cartService.list(buyerId, { page: '2', limit: '5' });

  expect(result).toMatchObject({ total: 21, page: 2, limit: 5, totalPages: 5 });
  expect(query.skip).toHaveBeenCalledWith(5);
  expect(query.limit).toHaveBeenCalledWith(5);
  expect(CartItem.countDocuments).toHaveBeenCalledWith({
    user: buyerId,
    product: { $in: [productId] }
  });
});
