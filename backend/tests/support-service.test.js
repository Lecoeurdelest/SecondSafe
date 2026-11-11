process.env.CHAT_ENCRYPTION_KEY = 'support-service-test-encryption-key';

jest.mock('../src/modules/support/support-conversation.model', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));
jest.mock('../src/modules/support/support-message.model', () => ({
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn()
}));

const SupportConversation = require('../src/modules/support/support-conversation.model');
const SupportMessage = require('../src/modules/support/support-message.model');
const { decryptChatContent } = require('../src/common/utils/chat-crypto.util');
const supportService = require('../src/modules/support/support.service');

const CONVERSATION_ID = '507f1f77bcf86cd799439011';
const CUSTOMER_ID = '507f1f77bcf86cd799439012';
const OTHER_USER_ID = '507f1f77bcf86cd799439013';

function populatedQuery(value) {
  const query = Promise.resolve(value);
  query.populate = jest.fn(() => query);
  return query;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('support messages and previews are encrypted before persistence', async () => {
  const conversation = {
    _id: CONVERSATION_ID,
    customerId: CUSTOMER_ID,
    populate: jest.fn().mockResolvedValue(undefined)
  };
  const message = {
    _id: '507f1f77bcf86cd799439014',
    senderId: CUSTOMER_ID,
    senderRole: 'user',
    createdAt: new Date(),
    populate: jest.fn().mockResolvedValue(undefined)
  };
  SupportConversation.create.mockImplementation(async value => ({ ...value, ...conversation }));
  SupportMessage.create.mockImplementation(async value => ({ ...value, ...message }));

  const result = await supportService.createConversation(CUSTOMER_ID, 'user', {
    subject: 'Cần hỗ trợ đơn hàng',
    message: 'Tin nhắn riêng tư'
  });

  const storedConversation = SupportConversation.create.mock.calls[0][0];
  const storedMessage = SupportMessage.create.mock.calls[0][0];
  expect(storedConversation.lastMessage).toMatch(/^enc:v1:/);
  expect(storedMessage.content).toMatch(/^enc:v1:/);
  expect(decryptChatContent(storedConversation.lastMessage)).toBe('Tin nhắn riêng tư');
  expect(decryptChatContent(storedMessage.content)).toBe('Tin nhắn riêng tư');
  expect(result.message.content).toBe('Tin nhắn riêng tư');
  expect(result.conversation.lastMessage).toBe('Tin nhắn riêng tư');
});

test('customers cannot read another customer support conversation', async () => {
  SupportConversation.findById.mockReturnValue(populatedQuery({
    _id: CONVERSATION_ID,
    customerId: CUSTOMER_ID
  }));

  await expect(supportService.getConversation(CONVERSATION_ID, OTHER_USER_ID, 'user'))
    .rejects.toMatchObject({ statusCode: 403 });
});

test('support staff can access customer conversations', async () => {
  const conversation = { _id: CONVERSATION_ID, customerId: CUSTOMER_ID };
  SupportConversation.findById.mockReturnValue(populatedQuery(conversation));

  await expect(supportService.getConversation(CONVERSATION_ID, OTHER_USER_ID, 'moderator'))
    .resolves.toBe(conversation);
});
