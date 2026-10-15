process.env.JWT_SECRET = 'chat-test-secret';
process.env.CHAT_ENCRYPTION_KEY = 'chat-test-encryption-key';

jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/products/product.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/orders/order.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/chat/conversation.model', () => ({
  findOne: jest.fn(), findById: jest.fn(), find: jest.fn(), create: jest.fn(), countDocuments: jest.fn(), updateOne: jest.fn()
}));
jest.mock('../src/modules/chat/message.model', () => ({
  find: jest.fn(), countDocuments: jest.fn(), create: jest.fn(), markAllAsRead: jest.fn()
}));

const request = require('supertest');
const User = require('../src/modules/users/user.model');
const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const Conversation = require('../src/modules/chat/conversation.model');
const Message = require('../src/modules/chat/message.model');
const { generateJWT } = require('../src/common/utils/jwt.util');
const { encryptChatContent, decryptChatContent } = require('../src/common/utils/chat-crypto.util');
const logger = require('../src/common/utils/logger.util');
const app = require('../src/app');

const BUYER = '507f1f77bcf86cd799439011';
const SELLER = '507f1f77bcf86cd799439012';
const STRANGER = '507f1f77bcf86cd799439013';
const MODERATOR = '507f1f77bcf86cd799439014';
const PRODUCT = '64b7f0000000000000000001';
const ORDER = '64b7f0000000000000000002';
const CONVERSATION = '64b7f0000000000000000003';
const ROLES = { [BUYER]: 'user', [SELLER]: 'user', [STRANGER]: 'user', [MODERATOR]: 'moderator' };

// Query gia lap chuoi mongoose: cac method tra ve chinh no, await ra `result`.
function chain(result) {
  const query = {};
  for (const method of ['populate', 'sort', 'skip', 'limit', 'select']) query[method] = jest.fn(() => query);
  query.lean = jest.fn(() => Promise.resolve(result));
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

function conversationDoc(overrides = {}) {
  return { _id: CONVERSATION, buyerId: { _id: BUYER }, sellerId: { _id: SELLER }, productId: { _id: PRODUCT }, status: 'active', ...overrides };
}

function auth(userId) {
  return `Bearer ${generateJWT({ userId })}`;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(logger, 'error').mockImplementation(() => {});
  User.findById.mockImplementation(id => chain({ _id: id, email: `${id}@example.test`, fullName: 'User', role: ROLES[id] }));
  Conversation.updateOne.mockResolvedValue({ acknowledged: true });
  Message.markAllAsRead.mockResolvedValue({ acknowledged: true });
});
afterEach(() => jest.restoreAllMocks());

describe('AC-CHAT-01-1 open a product conversation', () => {
  beforeEach(() => Product.findById.mockReturnValue(chain({ _id: PRODUCT, seller: SELLER })));

  test('returns the existing conversation for (buyer, seller, listing)', async () => {
    Conversation.findOne.mockReturnValue(chain(conversationDoc()));
    const response = await request(app).post('/api/chat/conversations')
      .set('Authorization', auth(BUYER)).send({ sellerId: SELLER, productId: PRODUCT });

    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(CONVERSATION);
    expect(Conversation.findOne).toHaveBeenCalledWith({ buyerId: BUYER, sellerId: SELLER, productId: PRODUCT });
    expect(Conversation.create).not.toHaveBeenCalled();
  });

  test('creates the conversation when none exists, with the listing owner as seller', async () => {
    Conversation.findOne.mockReturnValue(chain(null));
    Conversation.create.mockResolvedValue({ ...conversationDoc(), populate: jest.fn().mockResolvedValue() });
    const response = await request(app).post('/api/chat/conversations')
      .set('Authorization', auth(SELLER)).send({ sellerId: BUYER, productId: PRODUCT });

    expect(response.status).toBe(200);
    expect(Conversation.create).toHaveBeenCalledWith({ buyerId: BUYER, sellerId: SELLER, productId: PRODUCT });
  });

  test('rejects a conversation with yourself', async () => {
    const response = await request(app).post('/api/chat/conversations')
      .set('Authorization', auth(SELLER)).send({ sellerId: SELLER, productId: PRODUCT });
    expect(response.status).toBe(400);
    expect(Conversation.create).not.toHaveBeenCalled();
  });

  test('returns 404 for an unknown listing and 400 for malformed ids', async () => {
    Product.findById.mockReturnValue(chain(null));
    const missing = await request(app).post('/api/chat/conversations')
      .set('Authorization', auth(BUYER)).send({ sellerId: SELLER, productId: PRODUCT });
    const malformed = await request(app).post('/api/chat/conversations')
      .set('Authorization', auth(BUYER)).send({ sellerId: SELLER, productId: 'not-an-id' });
    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(400);
  });

  test('requires authentication', async () => {
    const response = await request(app).post('/api/chat/conversations').send({ sellerId: SELLER, productId: PRODUCT });
    expect(response.status).toBe(401);
  });
});

describe('AC-CHAT-01-2 order conversation', () => {
  beforeEach(() => {
    Order.findById.mockReturnValue(chain({ _id: ORDER, buyerId: BUYER, sellerId: SELLER, productId: PRODUCT }));
    Conversation.findOne.mockReturnValue(chain(conversationDoc()));
  });

  test.each([BUYER, SELLER])('order party %s can open it', async userId => {
    const response = await request(app).post(`/api/chat/orders/${ORDER}/conversation`).set('Authorization', auth(userId));
    expect(response.status).toBe(200);
  });

  test('other users are forbidden', async () => {
    const response = await request(app).post(`/api/chat/orders/${ORDER}/conversation`).set('Authorization', auth(STRANGER));
    expect(response.status).toBe(403);
    expect(Conversation.findOne).not.toHaveBeenCalled();
  });
});

describe('INV-05 conversation visibility', () => {
  beforeEach(() => Conversation.findById.mockReturnValue(chain(conversationDoc())));

  test('a non-participant cannot read the conversation', async () => {
    const response = await request(app).get(`/api/chat/conversations/${CONVERSATION}`).set('Authorization', auth(STRANGER));
    expect(response.status).toBe(403);
  });

  test('a moderator can read the conversation', async () => {
    const response = await request(app).get(`/api/chat/conversations/${CONVERSATION}`).set('Authorization', auth(MODERATOR));
    expect(response.status).toBe(200);
  });
});

describe('AC-CHAT-02-3 / AC-NFR-SEC-07-1 send over REST with encryption at rest', () => {
  beforeEach(() => {
    Conversation.findById.mockReturnValue(chain(conversationDoc()));
    Message.create.mockImplementation(async data => ({ _id: 'm1', ...data, populate: jest.fn().mockResolvedValue() }));
  });

  test('stores ciphertext, returns plaintext and increments the other side unread count', async () => {
    const response = await request(app).post('/api/chat/messages')
      .set('Authorization', auth(BUYER)).send({ conversationId: CONVERSATION, content: '  Còn hàng không?  ' });

    expect(response.status).toBe(200);
    expect(response.body.data.content).toBe('Còn hàng không?');
    const stored = Message.create.mock.calls[0][0].content;
    expect(stored).toMatch(/^enc:v1:/);
    expect(stored).not.toContain('Còn hàng');
    expect(decryptChatContent(stored)).toBe('Còn hàng không?');
    expect(Conversation.updateOne).toHaveBeenCalledWith({ _id: CONVERSATION }, expect.objectContaining({
      $set: expect.objectContaining({ lastMessage: 'Còn hàng không?' }),
      $inc: { sellerUnreadCount: 1 }
    }));
  });

  test('image messages need an imageUrl and use a photo preview', async () => {
    const missing = await request(app).post('/api/chat/messages')
      .set('Authorization', auth(SELLER)).send({ conversationId: CONVERSATION, type: 'image' });
    const sent = await request(app).post('/api/chat/messages')
      .set('Authorization', auth(SELLER)).send({ conversationId: CONVERSATION, type: 'image', metadata: { imageUrl: '/uploads/a.png' } });

    expect(missing.status).toBe(400);
    expect(sent.status).toBe(200);
    expect(sent.body.data.metadata).toEqual({ imageUrl: '/uploads/a.png' });
    expect(Conversation.updateOne).toHaveBeenCalledWith({ _id: CONVERSATION }, expect.objectContaining({
      $set: expect.objectContaining({ lastMessage: '📷 Hình ảnh' }),
      $inc: { buyerUnreadCount: 1 }
    }));
  });

  test.each([
    [{ content: '   ' }, 400],
    [{ content: 'x'.repeat(1001) }, 400],
    [{ content: 'hi', type: 'offer' }, 400]
  ])('rejects invalid payload %#', async (body, status) => {
    const response = await request(app).post('/api/chat/messages')
      .set('Authorization', auth(BUYER)).send({ conversationId: CONVERSATION, ...body });
    expect(response.status).toBe(status);
    expect(Message.create).not.toHaveBeenCalled();
  });

  test('a non-participant cannot send', async () => {
    const response = await request(app).post('/api/chat/messages')
      .set('Authorization', auth(STRANGER)).send({ conversationId: CONVERSATION, content: 'hello' });
    expect(response.status).toBe(403);
    expect(Message.create).not.toHaveBeenCalled();
  });

  test('a closed conversation rejects new messages', async () => {
    Conversation.findById.mockReturnValue(chain(conversationDoc({ status: 'blocked' })));
    const response = await request(app).post('/api/chat/messages')
      .set('Authorization', auth(BUYER)).send({ conversationId: CONVERSATION, content: 'hello' });
    expect(response.status).toBe(409);
  });
});

describe('AC-CHAT-04-1 / AC-CHAT-04-2 list and history', () => {
  test('lists active conversations of the caller sorted by last message', async () => {
    const query = chain([conversationDoc()]);
    Conversation.find.mockReturnValue(query);
    Conversation.countDocuments.mockResolvedValue(1);
    const response = await request(app).get('/api/chat/conversations').set('Authorization', auth(BUYER));

    expect(response.status).toBe(200);
    expect(response.body.data.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(Conversation.find).toHaveBeenCalledWith({ $or: [{ buyerId: BUYER }, { sellerId: BUYER }], status: 'active' });
    expect(query.sort).toHaveBeenCalledWith({ lastMessageAt: -1 });
  });

  test('history is paginated oldest-first, decrypts legacy and encrypted content and resets the caller unread count', async () => {
    Conversation.findById.mockReturnValue(chain(conversationDoc()));
    const query = chain([
      { _id: 'm2', content: encryptChatContent('mới') },
      { _id: 'm1', content: 'tin cũ chưa mã hóa' }
    ]);
    Message.find.mockReturnValue(query);
    Message.countDocuments.mockResolvedValue(2);
    const response = await request(app).get(`/api/chat/conversations/${CONVERSATION}/messages?page=2&limit=1`)
      .set('Authorization', auth(SELLER));

    expect(response.status).toBe(200);
    expect(response.body.data.messages.map(message => message.content)).toEqual(['tin cũ chưa mã hóa', 'mới']);
    expect(response.body.data.pagination).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(query.skip).toHaveBeenCalledWith(1);
    expect(Message.markAllAsRead).toHaveBeenCalledWith(CONVERSATION, SELLER);
    expect(Conversation.updateOne).toHaveBeenCalledWith({ _id: CONVERSATION }, { $set: { sellerUnreadCount: 0 } });
  });
});

test('AC-NFR-SEC-07-1 encryption requires CHAT_ENCRYPTION_KEY without falling back to JWT_SECRET', () => {
  const key = process.env.CHAT_ENCRYPTION_KEY;
  delete process.env.CHAT_ENCRYPTION_KEY;
  try {
    expect(() => encryptChatContent('secret')).toThrow('Thiếu khóa mã hóa chat');
  } finally {
    process.env.CHAT_ENCRYPTION_KEY = key;
  }
});
