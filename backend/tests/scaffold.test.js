const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const request = require('supertest');

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secondsafe-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');

const MODULES_DIR = path.join(__dirname, '..', 'src', 'modules');
const EXPECTED_MODELS = [
  'Category', 'Conversation', 'Delivery', 'Dispute', 'EscrowHold', 'Favorite', 'Message', 'Notification',
  'Order', 'Product', 'PurchaseRequest', 'Report', 'Review', 'Transaction', 'User', 'Wallet'
];

function modelFiles() {
  return fs.readdirSync(MODULES_DIR).flatMap((moduleName) =>
    fs.readdirSync(path.join(MODULES_DIR, moduleName))
      .filter((file) => file.endsWith('.model.js'))
      .map((file) => path.join(MODULES_DIR, moduleName, file)));
}

function indexKeys(modelName) {
  return mongoose.model(modelName).schema.indexes().map(([key, options]) => ({ key, unique: Boolean(options && options.unique) }));
}

beforeAll(() => {
  modelFiles().forEach((file) => require(file));
});

describe('HTTP shell', () => {
  test('GET /api/health reports the service', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, service: 'secondsafe-backend' });
  });

  test('module routers are mounted but expose no business endpoints yet', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(404);
  });
});

describe('Database contract', () => {
  test('all 16 baseline models are registered', () => {
    expect(mongoose.modelNames().sort()).toEqual(EXPECTED_MODELS);
  });

  test('uniqueness invariants are declared', () => {
    expect(indexKeys('User')).toContainEqual({ key: { email: 1 }, unique: true });
    expect(indexKeys('Favorite')).toContainEqual({ key: { user: 1, product: 1 }, unique: true });
    expect(indexKeys('Conversation')).toContainEqual({ key: { buyerId: 1, sellerId: 1, productId: 1 }, unique: true });
  });

  test('order and money enums match the documented lifecycle', () => {
    expect(mongoose.model('Order').schema.path('status').enumValues).toEqual([
      'awaiting_seller_confirmation', 'awaiting_payment', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'
    ]);
    expect(mongoose.model('EscrowHold').schema.path('status').enumValues).toEqual(['held', 'released', 'refunded']);
    expect(mongoose.model('Transaction').schema.path('type').enumValues).toEqual([
      'deposit', 'withdrawal', 'payment', 'refund', 'earning', 'fee'
    ]);
  });

  test('required fields are enforced without a database', () => {
    const error = new (mongoose.model('Product'))({}).validateSync();
    expect(Object.keys(error.errors)).toEqual(expect.arrayContaining(['title', 'description', 'price', 'seller']));
  });
});

describe('Seed data', () => {
  test('category seeds satisfy the Category schema', () => {
    const { categories } = require('../src/seeds/categories.seed');
    const Category = mongoose.model('Category');
    expect(categories.length).toBeGreaterThan(0);
    categories.forEach((category) => expect(new Category(category).validateSync()).toBeUndefined());
  });

  test('product seeds satisfy the Product schema and reference seeded categories', () => {
    const { categories } = require('../src/seeds/categories.seed');
    const { productsData } = require('../src/seeds/products.seed');
    const Product = mongoose.model('Product');
    const slugs = new Set(categories.map((category) => category.slug));
    expect(productsData.length).toBeGreaterThan(0);
    productsData.forEach(({ categorySlug, ...product }) => {
      expect(slugs.has(categorySlug)).toBe(true);
      const document = new Product({
        ...product,
        category: new mongoose.Types.ObjectId(),
        seller: new mongoose.Types.ObjectId(),
        images: ['/images/placeholders/product-placeholder.svg']
      });
      expect(document.validateSync()).toBeUndefined();
    });
  });
});

describe('Chat encryption at rest', () => {
  test('encrypted content round-trips and legacy plaintext stays readable', () => {
    process.env.CHAT_ENCRYPTION_KEY = 'test-chat-key';
    jest.resetModules();
    const { encryptChatContent, decryptChatContent } = require('../src/common/utils/chat-crypto.util');
    const payload = encryptChatContent('Xin chào');
    expect(payload.startsWith('enc:v1:')).toBe(true);
    expect(decryptChatContent(payload)).toBe('Xin chào');
    expect(decryptChatContent('legacy text')).toBe('legacy text');
  });
});
