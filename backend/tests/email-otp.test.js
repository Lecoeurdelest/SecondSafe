const net = require('node:net');
const nodemailer = require('nodemailer');
const { createMailer } = require('../src/common/utils/email.util');
const { createCodeManager } = require('../src/common/utils/otp.manager');
const { createMemoryStore } = require('../src/common/utils/expiring-store.util');
const business = require('../src/config/business');
const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../src/common/middlewares/error.middleware');

describe('one-time codes', () => {
  let time, manager, store;
  beforeEach(() => {
    time = 1000;
    store = createMemoryStore({ now: () => time });
    manager = createCodeManager({ now: () => time, store });
  });

  test('crypto-generated six digit code normalizes email and consumes payload only once', async () => {
    const payload = { passwordHash: '$2a$hashed-password', fullName: 'Tester' };
    const code = await manager.generateAndSaveOtp(' Person@example.com ', payload);
    expect(code).toMatch(/^\d{6}$/);
    expect(await manager.verifyOtp('person@EXAMPLE.COM', code)).toMatchObject({ valid: true, userData: payload });
    expect(await manager.verifyOtp('person@example.com', code)).toMatchObject({ valid: false });
  });

  test('code expires exactly at its configured deadline', async () => {
    const code = await manager.issue('a@example.com');
    time += business.otpTtlMs;
    expect(await manager.consume('a@example.com', code)).toMatchObject({ valid: false });
  });

  test('custom clock is shared by the default store when no adapter is injected', async () => {
    const customClock = createCodeManager({ now: () => 1000 });
    const code = await customClock.issue('clock@example.com');
    expect(await customClock.consume('clock@example.com', code)).toMatchObject({ valid: true });
  });

  test('non-string purpose cannot be silently coerced into a namespace', async () => {
    await expect(manager.issue('a@example.com', { purpose: null })).rejects.toHaveProperty('statusCode', 400);
    await expect(manager.consume('a@example.com', '123456', { purpose: {} })).rejects.toHaveProperty('statusCode', 400);
  });

  test('four wrong attempts preserve code, the fifth invalidates it', async () => {
    expect(business.otpMaxAttempts).toBe(5);
    const code = await manager.issue('a@example.com');
    for (let attempt = 0; attempt < 4; attempt += 1) await manager.consume('a@example.com', 'wrong');
    expect(await manager.consume('a@example.com', code)).toMatchObject({ valid: true });
    const next = await manager.issue('a@example.com');
    for (let attempt = 0; attempt < 5; attempt += 1) await manager.consume('a@example.com', 'wrong');
    expect(await manager.consume('a@example.com', next)).toMatchObject({ valid: false });
  });

  test('registration, login and recovery use separate namespaces', async () => {
    const code = await manager.issue('a@example.com', { purpose: 'login-2fa' });
    expect(await manager.consume('a@example.com', code)).toMatchObject({ valid: false });
    expect(await manager.consume('a@example.com', code, { purpose: 'login-2fa' })).toMatchObject({ valid: true });
  });

  test('recovery tokens have 256 bits of entropy and their own deadline', async () => {
    const code = await manager.issue('a@example.com', { purpose: 'recovery', token: true, ttlMs: business.resetCredentialTtlMs });
    expect(code).toMatch(/^[a-f0-9]{64}$/);
    time += business.otpTtlMs;
    expect(await manager.consume('a@example.com', code, { purpose: 'recovery' })).toMatchObject({ valid: true });
  });

  test('replacement resets attempts and explicit invalidation revokes pending codes', async () => {
    await manager.issue('a@example.com');
    await manager.consume('a@example.com', 'wrong');
    const replacement = await manager.issue('a@example.com');
    await manager.invalidate('a@example.com');
    expect(await manager.consume('a@example.com', replacement)).toMatchObject({ valid: false });
  });

  test('concurrent successful verification can consume the code only once', async () => {
    const code = await manager.issue('a@example.com');
    const results = await Promise.all(Array.from({ length: 10 }, () => manager.consume('a@example.com', code)));
    expect(results.filter(result => result.valid)).toHaveLength(1);
  });

  test('record contains salted digest and hashed key instead of email or plaintext code', async () => {
    const calls = [];
    const adapter = { update: jest.fn(async (key, update) => { const next = update(undefined); calls.push({ key, ...next }); return next.result; }) };
    const code = await createCodeManager({ store: adapter }).issue('private@example.com');
    expect(calls[0].key).not.toContain('private@example.com');
    expect(JSON.stringify(calls[0].record)).not.toContain(code);
    expect(calls[0].record.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('rejects invalid subject, namespace, lifetime and oversized submitted code', async () => {
    await expect(manager.issue('')).rejects.toHaveProperty('statusCode', 400);
    await expect(manager.issue('a', { purpose: '../bad' })).rejects.toHaveProperty('statusCode', 400);
    await expect(manager.issue('a', { ttlMs: 0 })).rejects.toThrow(TypeError);
    await manager.issue('a');
    expect(await manager.consume('a', 'x'.repeat(1000))).toMatchObject({ valid: false });
  });

  test('bounds storage and reclaims expired entries without a process timer', async () => {
    const bounded = createMemoryStore({ now: () => time, maxEntries: 1 });
    await bounded.update('a', () => ({ record: { expiresAt: time + 1 } }));
    await expect(bounded.update('b', () => ({ record: { expiresAt: time + 2 } }))).rejects.toHaveProperty('statusCode', 503);
    time += 1;
    await expect(bounded.update('b', () => ({ record: { expiresAt: time + 2 }, result: true }))).resolves.toBe(true);
  });

  test('store isolates payload references and forwards adapter failures', async () => {
    const payload = { fullName: 'Original' };
    const code = await manager.issue('a', { payload });
    payload.fullName = 'Changed';
    expect((await manager.consume('a', code)).payload.fullName).toBe('Original');
    const broken = createCodeManager({ store: { update: async () => { throw new Error('offline'); } } });
    await expect(broken.issue('a')).rejects.toThrow('offline');
  });
});

describe('SMTP delivery', () => {
  const env = { SMTP_HOST: 'smtp.fixture.test', SMTP_PORT: '587', SMTP_USER: 'sender@example.com', SMTP_PASS: 'disposable-fixture-password' };
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

  test.each(['sendRegisterOtpEmail', 'sendLogin2faOtpEmail', 'sendRecoveryEmail'])('%s sends escaped HTML and plain text through configured sender', async method => {
    const transport = { sendMail: jest.fn().mockResolvedValue({ rejected: [] }) };
    const mailer = createMailer({ transport, env });
    await expect(mailer[method]('receiver@example.com', '<secret>')).resolves.toEqual({ delivered: true });
    const mail = transport.sendMail.mock.calls[0][0];
    expect(mail.from).toEqual({ name: 'SecondSafe', address: env.SMTP_USER });
    expect(mail.to).toBe('receiver@example.com');
    expect(mail.html).toContain('&lt;secret&gt;');
    expect(mail.html).not.toContain('<secret>');
    expect(mail.text).toContain('<secret>');
  });

  test('configures connection, greeting and socket timeouts with explicit SMTP settings', async () => {
    const spy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail: async () => ({}) });
    await createMailer({ env, timeoutMs: 1234 }).sendRegisterOtpEmail('r@example.com', '123456');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ host: env.SMTP_HOST, port: 587, secure: false, connectionTimeout: 1234, greetingTimeout: 1234, socketTimeout: 1234, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }));
  });

  test('preserves Gmail environment fallback', async () => {
    const spy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail: async () => ({}) });
    await createMailer({ env: { EMAIL_USER: 'legacy@example.com', EMAIL_PASS: 'fixture' } }).sendLogin2faOtpEmail('r@example.com', '123456');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ service: 'gmail', auth: { user: 'legacy@example.com', pass: 'fixture' } }));
  });

  test('delivery errors never expose SMTP credentials or provider responses', async () => {
    const mailer = createMailer({ env, transport: { sendMail: async () => { throw new Error('535 auth failed: disposable-fixture-password'); } } });
    await expect(mailer.sendRegisterOtpEmail('r@example.com', '123456')).rejects.toMatchObject({ statusCode: 503, expose: true, message: 'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.' });
  });

  test('HTTP delivery failure is 503 with a safe Vietnamese message', async () => {
    const mailer = createMailer({ env, transport: { sendMail: async () => { throw new Error('SMTP provider private response'); } } });
    const app = express();
    app.post('/send', (req, res, next) => mailer.sendRegisterOtpEmail('r@example.com', '123456').then(() => res.sendStatus(200)).catch(next));
    app.use(errorHandler);
    const response = await request(app).post('/send');
    expect(response.status).toBe(503);
    expect(response.body.message).toBe('Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.');
    expect(JSON.stringify(response.body)).not.toContain('provider');
  });

  test('maps rejected recipients and missing configuration to safe 503', async () => {
    await expect(createMailer({ env, transport: { sendMail: async () => ({ rejected: ['r@example.com'] }) } }).sendRecoveryEmail('r@example.com', 'code')).rejects.toHaveProperty('statusCode', 503);
    await expect(createMailer({ env: {} }).sendRecoveryEmail('r@example.com', 'code')).rejects.toHaveProperty('statusCode', 503);
    await expect(createMailer({ env: { ...env, SMTP_PORT: 'bad' } }).sendRecoveryEmail('r@example.com', 'code')).rejects.toHaveProperty('statusCode', 503);
  });

  test('hanging SMTP request ends at deadline', async () => {
    jest.useFakeTimers();
    const pending = createMailer({ env, transport: { sendMail: () => new Promise(() => {}) }, timeoutMs: 100 }).sendRegisterOtpEmail('r@example.com', '123456');
    const assertion = expect(pending).rejects.toHaveProperty('statusCode', 503);
    await jest.advanceTimersByTimeAsync(100);
    await assertion;
  });

  test('rejects multiple recipients and header injection before sending', async () => {
    const transport = { sendMail: jest.fn() };
    await expect(createMailer({ transport, env }).sendRecoveryEmail('r@example.com\r\nBcc: hidden@example.com', 'code')).rejects.toHaveProperty('statusCode', 400);
    expect(transport.sendMail).not.toHaveBeenCalled();
  });

  test('real Nodemailer completes SMTP authentication, envelope and DATA against a local fixture', async () => {
    const messages = [];
    const connections = new Set();
    const server = net.createServer(socket => {
      connections.add(socket);
      socket.on('close', () => connections.delete(socket));
      socket.write('220 localhost fixture\r\n');
      let buffer = '', data = false, message = '';
      socket.on('data', chunk => {
        buffer += chunk.toString();
        while (buffer.includes('\r\n')) {
          const end = buffer.indexOf('\r\n');
          const line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (data && line !== '.') { message += `${line}\r\n`; continue; }
          if (data) { messages.push(message); data = false; socket.write('250 queued\r\n'); continue; }
          if (line.startsWith('EHLO')) socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
          else if (line.startsWith('AUTH')) socket.write('235 authenticated\r\n');
          else if (line === 'DATA') { data = true; socket.write('354 send data\r\n'); }
          else if (line === 'QUIT') socket.end('221 goodbye\r\n');
          else socket.write('250 OK\r\n');
        }
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const localEnv = { ...env, SMTP_HOST: '127.0.0.1', SMTP_PORT: String(server.address().port) };
      await expect(createMailer({ env: localEnv }).sendRegisterOtpEmail('r@example.com', '987654')).resolves.toEqual({ delivered: true });
      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain('987654');
      expect(messages[0]).toContain('From: SecondSafe <sender@example.com>');
      expect(messages[0]).toContain('To: r@example.com');
    } finally {
      for (const socket of connections) socket.destroy();
      await new Promise(resolve => server.close(resolve));
    }
  });
});
