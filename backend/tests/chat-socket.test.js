process.env.JWT_SECRET = 'chat-socket-test-secret';
process.env.CHAT_ENCRYPTION_KEY = 'chat-socket-test-encryption-key';

jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/chat/chat.service', () => ({
  sendMessage: jest.fn(),
  markMessagesAsRead: jest.fn()
}));

const http = require('http');
const { Server } = require('socket.io');
const { io: connectClient } = require('socket.io-client');
const User = require('../src/modules/users/user.model');
const chatService = require('../src/modules/chat/chat.service');
const { initializeChatSocket, isUserOnline, emitMessageToConversation, emitToUser } = require('../src/modules/chat/chat.socket');
const { createMemoryStore } = require('../src/common/utils/expiring-store.util');
const { generateJWT } = require('../src/common/utils/jwt.util');
const logger = require('../src/common/utils/logger.util');

const BUYER = '507f1f77bcf86cd799439011';
const SELLER = '507f1f77bcf86cd799439012';
const STRANGER = '507f1f77bcf86cd799439013';
const CONVERSATION = '64b7f0000000000000000003';

let server;
const memoryStore = createMemoryStore();
// Spy tren store interface de chung minh presence di qua store (AC-NFR-REL-04-2).
const presenceStore = { update: jest.fn((key, updater) => memoryStore.update(key, updater)) };
let url;
const clients = [];

function connect(userId, token = generateJWT({ userId })) {
  const client = connectClient(url, { auth: { token }, transports: ['websocket'], reconnection: false, forceNew: true });
  clients.push(client);
  return client;
}

function once(client, event) {
  return new Promise(resolve => client.once(event, resolve));
}

// Cho dieu kien bat dong bo (presence cap nhat sau khi ket noi) toi da ~1s.
async function waitFor(check, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('condition not met');
}

function emitWithAck(client, event, payload) {
  return new Promise(resolve => client.emit(event, payload, resolve));
}

async function connected(userId) {
  const client = connect(userId);
  await once(client, 'connect');
  return client;
}

beforeAll(done => {
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  server = http.createServer();
  initializeChatSocket(new Server(server), { store: presenceStore });
  server.listen(0, () => {
    url = `http://localhost:${server.address().port}`;
    done();
  });
});

afterAll(done => {
  jest.restoreAllMocks();
  server.close(done);
});

beforeEach(() => {
  User.findById.mockImplementation(id => ({
    select: () => ({ lean: () => Promise.resolve({ _id: id, role: 'user', fullName: 'User' }) })
  }));
  chatService.markMessagesAsRead.mockImplementation(async (conversationId, userId) => {
    if (userId === STRANGER) throw Object.assign(new Error('Bạn không có quyền truy cập cuộc trò chuyện này'), { statusCode: 403 });
    return { conversationId };
  });
});

afterEach(() => {
  while (clients.length) clients.pop().disconnect();
  jest.clearAllMocks();
});

test('rejects connections without a valid token', async () => {
  const client = connect(BUYER, 'not-a-token');
  const error = await once(client, 'connect_error');
  expect(error.message).toBe('Authentication error');
});

test('AC-CHAT-02 a message sent by socket reaches the other participant in real time', async () => {
  const buyer = await connected(BUYER);
  const seller = await connected(SELLER);
  await waitFor(() => isUserOnline(BUYER));
  await emitWithAck(seller, 'join_conversation', { conversationId: CONVERSATION });

  const message = { _id: 'm1', content: 'Còn hàng không?', senderId: { _id: BUYER } };
  chatService.sendMessage.mockResolvedValue({ message, recipients: [SELLER] });
  const received = once(seller, 'receive_message');
  const notified = once(seller, 'new_message_notification');

  const ack = await emitWithAck(buyer, 'send_message', { conversationId: CONVERSATION, content: 'Còn hàng không?' });

  expect(ack).toEqual({ success: true, data: message });
  expect(chatService.sendMessage).toHaveBeenCalledWith(
    CONVERSATION, BUYER, { content: 'Còn hàng không?', type: undefined, metadata: undefined }, 'user'
  );
  expect(await received).toEqual({ conversationId: CONVERSATION, message: { ...message, conversation: CONVERSATION } });
  expect(await notified).toEqual({ conversationId: CONVERSATION, message });
});

test('INV-05 a non-participant cannot join a conversation room', async () => {
  const stranger = await connected(STRANGER);
  const ack = await emitWithAck(stranger, 'join_conversation', CONVERSATION);
  expect(ack).toEqual({ success: false, message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
});

test('typing indicators are relayed only inside a joined room', async () => {
  const buyer = await connected(BUYER);
  const seller = await connected(SELLER);
  await emitWithAck(buyer, 'join_conversation', CONVERSATION);
  await emitWithAck(seller, 'join_conversation', CONVERSATION);

  const typing = once(seller, 'user_typing');
  buyer.emit('typing', { conversationId: CONVERSATION });
  expect(await typing).toEqual({ conversationId: CONVERSATION, userId: BUYER });
});

test('service failures are reported to the sender without crashing the connection', async () => {
  const buyer = await connected(BUYER);
  chatService.sendMessage.mockRejectedValue(new Error('database down'));
  const ack = await emitWithAck(buyer, 'send_message', { conversationId: CONVERSATION, content: 'x' });
  expect(ack).toEqual({ success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  expect(buyer.connected).toBe(true);
});

test('emitMessageToConversation (used by chat offers in orders) broadcasts to the conversation room', async () => {
  const seller = await connected(SELLER);
  await emitWithAck(seller, 'join_conversation', CONVERSATION);
  const offer = { _id: 'offer-1', type: 'offer', content: 'Người bán gửi đề nghị: 100.000đ' };
  const received = once(seller, 'receive_message');

  emitMessageToConversation(CONVERSATION, offer);

  expect(await received).toEqual({ conversationId: CONVERSATION, message: { ...offer, conversation: CONVERSATION } });
});

describe('AC-NFR-REL-04-2 presence through the store interface', () => {
  test('a user stays online until the last tab disconnects', async () => {
    const observer = await connected(SELLER);
    const firstTab = await connected(BUYER);
    const secondTab = await connected(BUYER);
    await waitFor(async () => (await presenceStore.update(`presence:${BUYER}`, previous => ({ record: previous, result: previous?.count }))) === 2);
    expect(presenceStore.update).toHaveBeenCalledWith(`presence:${BUYER}`, expect.any(Function));

    const offline = jest.fn();
    observer.on('user_offline', offline);
    firstTab.disconnect();
    await waitFor(async () => (await presenceStore.update(`presence:${BUYER}`, previous => ({ record: previous, result: previous?.count }))) === 1);
    expect(offline).not.toHaveBeenCalled();
    expect(await isUserOnline(BUYER)).toBe(true);

    const wentOffline = once(observer, 'user_offline');
    secondTab.disconnect();
    expect(await wentOffline).toEqual({ userId: BUYER });
    expect(await isUserOnline(BUYER)).toBe(false);
  });

  test('a new connection receives the users currently online', async () => {
    await connected(SELLER);
    const buyer = connect(BUYER);
    const snapshot = await once(buyer, 'online_users');
    expect(snapshot).toEqual(expect.arrayContaining([SELLER, BUYER]));
  });
});

test('AC-NOTI-01-2 emitToUser reaches every connected socket of the recipient', async () => {
  const firstTab = await connected(BUYER);
  const secondTab = await connected(BUYER);
  const other = await connected(SELLER);
  const leaked = jest.fn();
  other.on('new_notification', leaked);
  const received = Promise.all([once(firstTab, 'new_notification'), once(secondTab, 'new_notification')]);

  emitToUser(BUYER, 'new_notification', { title: 'Đơn hàng mới' });

  expect(await received).toEqual([{ title: 'Đơn hàng mới' }, { title: 'Đơn hàng mới' }]);
  expect(leaked).not.toHaveBeenCalled();
});

test('AC-NFR-USA-03-1 a sent message reaches the connected recipient within 2 seconds', async () => {
  const buyer = await connected(BUYER);
  const seller = await connected(SELLER);
  await emitWithAck(seller, 'join_conversation', CONVERSATION);
  chatService.sendMessage.mockResolvedValue({ message: { _id: 'm-fast', content: 'nhanh' }, recipients: [SELLER] });
  const received = once(seller, 'receive_message');

  const started = Date.now();
  buyer.emit('send_message', { conversationId: CONVERSATION, content: 'nhanh' });
  await received;

  expect(Date.now() - started).toBeLessThan(2000);
});
