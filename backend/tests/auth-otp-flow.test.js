jest.mock('../src/modules/users/user.model', () => ({ findOne: jest.fn(), create: jest.fn(), findById: jest.fn() }));
jest.mock('../src/modules/notifications/notification.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/common/utils/email.util', () => ({
  sendRegisterOtpEmail: jest.fn(), sendLogin2faOtpEmail: jest.fn()
}));

const bcrypt = require('bcryptjs');
const controller = require('../src/modules/auth/auth.controller');
const service = require('../src/modules/auth/auth.service');
const User = require('../src/modules/users/user.model');
const mail = require('../src/common/utils/email.util');

function response() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

afterEach(() => jest.restoreAllMocks());

beforeEach(() => {
  jest.clearAllMocks();
  User.findOne.mockReturnValue({ select: () => ({ lean: async () => null }) });
  User.create.mockImplementation(async data => ({ ...data, _id: '507f1f77bcf86cd799439011' }));
});

test('registration awaits its code, stores a password hash and consumes the code once', async () => {
  const body = { email: 'registration@example.test', password: 'StrongPass123!', fullName: 'Test User', phone: '0912345678' };
  const requested = response();
  await controller.requestRegisterOtp({ body }, requested);
  expect(requested.status).toHaveBeenCalledWith(202);
  const [email, otpCode] = mail.sendRegisterOtpEmail.mock.calls[0];
  expect(otpCode).toMatch(/^\d{6}$/);
  expect(JSON.stringify(requested.json.mock.calls)).not.toContain(otpCode);

  const verified = response();
  await controller.verifyAndRegister({ body: { email, otpCode } }, verified);
  expect(verified.status).toHaveBeenCalledWith(201);
  const created = User.create.mock.calls[0][0];
  expect(created).toMatchObject({ email: body.email, fullName: body.fullName, phone: body.phone, role: 'user' });
  expect(await bcrypt.compare(body.password, created.password)).toBe(true);
  const replay = response();
  await controller.verifyAndRegister({ body: { email, otpCode } }, replay);
  expect(replay.status).toHaveBeenCalledWith(400);
  expect(User.create).toHaveBeenCalledTimes(1);
});

test('registration and login codes remain independent and 2FA completes only once', async () => {
  jest.spyOn(service, 'login').mockResolvedValue({ requires2FA: true, user: { id: '507f1f77bcf86cd799439011', email: 'two-factor@example.test' } });
  jest.spyOn(service, 'complete2FALogin').mockResolvedValue({ token: 'login-token' });
  const email = 'two-factor@example.test';
  const userId = '507f1f77bcf86cd799439011';
  await controller.requestRegisterOtp({ body: {
    email, password: 'StrongPass123!', fullName: 'Test User', phone: '0912345678'
  } }, response());
  const registrationCode = mail.sendRegisterOtpEmail.mock.calls[0][1];
  const wrongPurpose = response();
  await controller.verifyLogin2FA({ body: { email, otpCode: registrationCode } }, wrongPurpose);
  expect(wrongPurpose.status).toHaveBeenCalledWith(400);
  expect(service.complete2FALogin).not.toHaveBeenCalled();

  const login = response();
  await controller.login({ body: { email, password: 'StrongPass123!' } }, login);
  expect(login.json).toHaveBeenCalledWith(expect.objectContaining({ data: { requires2FA: true, email } }));
  const loginCode = mail.sendLogin2faOtpEmail.mock.calls[0][1];
  expect(loginCode).toMatch(/^\d{6}$/);
  const registered = response();
  await controller.verifyAndRegister({ body: { email, otpCode: registrationCode } }, registered);
  expect(registered.status).toHaveBeenCalledWith(201);

  const verified = response();
  await controller.verifyLogin2FA({ body: { email, otpCode: loginCode } }, verified);
  expect(verified.status).toHaveBeenCalledWith(200);
  expect(service.complete2FALogin).toHaveBeenCalledWith(userId);
  const replay = response();
  await controller.verifyLogin2FA({ body: { email, otpCode: loginCode } }, replay);
  expect(replay.status).toHaveBeenCalledWith(400);
  expect(service.complete2FALogin).toHaveBeenCalledTimes(1);
});
