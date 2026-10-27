jest.mock('../src/modules/users/user.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
}));
jest.mock('../src/modules/notifications/notification.model', () => ({ create: jest.fn() }));
jest.mock('../src/common/utils/otp.manager', () => ({
  issue: jest.fn(),
  consume: jest.fn(),
  invalidate: jest.fn()
}));
jest.mock('../src/common/utils/email.util', () => ({
  sendRegisterOtpEmail: jest.fn(),
  sendRecoveryEmail: jest.fn()
}));
jest.mock('../src/common/utils/logger.util', () => ({ error: jest.fn() }));

process.env.JWT_SECRET = 'auth-service-test-secret';
const bcrypt = require('bcryptjs');
const User = require('../src/modules/users/user.model');
const Notification = require('../src/modules/notifications/notification.model');
const otpManager = require('../src/common/utils/otp.manager');
const email = require('../src/common/utils/email.util');
const logger = require('../src/common/utils/logger.util');
const authService = require('../src/modules/auth/auth.service');

const userId = '507f1f77bcf86cd799439011';
const registration = {
  fullName: 'Test User',
  email: 'person@example.test',
  phone: '0912345678',
  password: 'StrongPass1!'
};

function query(value) {
  const result = {
    select: jest.fn(),
    lean: jest.fn().mockResolvedValue(value)
  };
  result.select.mockReturnValue(result);
  return result;
}

function userDocument(overrides = {}) {
  return {
    _id: userId,
    email: registration.email,
    fullName: registration.fullName,
    password: '$2b$12$hash',
    role: 'user',
    isSuspended: false,
    save: jest.fn().mockResolvedValue(undefined),
    toObject() {
      return { _id: this._id, email: this.email, fullName: this.fullName, role: this.role, password: this.password };
    },
    ...overrides
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = 'auth-service-test-secret';
  otpManager.issue.mockResolvedValue('123456');
  otpManager.consume.mockResolvedValue({ valid: true, payload: { ...registration, passwordHash: '$2b$12$hashed' } });
  email.sendRegisterOtpEmail.mockResolvedValue({ delivered: true });
  email.sendRecoveryEmail.mockResolvedValue({ delivered: true });
  Notification.create.mockResolvedValue({});
});

test('registration validates input, emails an OTP, and does not create an account before verification', async () => {
  User.findOne.mockReturnValue(query(null));

  await expect(authService.requestRegistrationCode(registration)).resolves.toEqual({ email: registration.email });

  expect(User.findOne).toHaveBeenCalledWith({
    $or: [{ email: registration.email }, { phone: registration.phone }]
  });
  expect(otpManager.issue).toHaveBeenCalledWith(registration.email, expect.objectContaining({
    purpose: 'register',
    payload: expect.objectContaining({
      email: registration.email,
      passwordHash: expect.stringMatching(/^\$2/)
    })
  }));
  expect(email.sendRegisterOtpEmail).toHaveBeenCalledWith(registration.email, '123456');
  expect(User.create).not.toHaveBeenCalled();
});

test.each([
  [{ ...registration, password: 'weak' }],
  [{ ...registration, phone: '123' }],
  [{ ...registration, email: 'not-an-email' }]
])('registration rejects invalid credentials before database or email work', async data => {
  await expect(authService.requestRegistrationCode(data)).rejects.toHaveProperty('statusCode', 400);
  expect(User.findOne).not.toHaveBeenCalled();
  expect(email.sendRegisterOtpEmail).not.toHaveBeenCalled();
});

test('registration verification creates a password-hashed account and returns a safe JWT profile', async () => {
  User.create.mockResolvedValue(userDocument());

  const result = await authService.verifyRegistration({ email: registration.email, code: '123456' });

  expect(otpManager.consume).toHaveBeenCalledWith(registration.email, '123456', { purpose: 'register' });
  expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
    email: registration.email,
    password: '$2b$12$hashed',
    role: 'user'
  }));
  expect(result.token).toEqual(expect.any(String));
  expect(result.user).not.toHaveProperty('password');
});

test('registration verification rejects an invalid or expired OTP without creating a user', async () => {
  otpManager.consume.mockResolvedValue({ valid: false });

  await expect(authService.verifyRegistration({ email: registration.email, code: '000000' }))
    .rejects.toHaveProperty('statusCode', 400);
  expect(User.create).not.toHaveBeenCalled();
});

test('login returns the same unauthorized error for an unknown account and a wrong password', async () => {
  User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  await expect(authService.login({ email: registration.email, password: 'wrong' }))
    .rejects.toMatchObject({ statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' });

  const passwordHash = await bcrypt.hash(registration.password, 4);
  User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userDocument({ password: passwordHash })) });
  await expect(authService.login({ email: registration.email, password: 'wrong' }))
    .rejects.toMatchObject({ statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' });
});

test('login performs a password hash check for unknown accounts and discloses suspension only after verification', async () => {
  const compare = jest.spyOn(bcrypt, 'compare');
  compare.mockResolvedValue(false);
  User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  await expect(authService.login({ email: registration.email, password: 'wrong' }))
    .rejects.toHaveProperty('statusCode', 401);
  expect(compare).toHaveBeenCalledWith('wrong', expect.stringMatching(/^\$2/));
  compare.mockRestore();

  const passwordHash = await bcrypt.hash(registration.password, 4);
  const suspendedUser = userDocument({
    password: passwordHash,
    isSuspended: true,
    suspendedUntil: new Date(Date.now() + 60_000),
    suspendedReason: 'Review pending'
  });
  User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(suspendedUser) });
  await expect(authService.login({ email: registration.email, password: registration.password }))
    .rejects.toMatchObject({ statusCode: 403, details: { reason: 'Review pending' } });
});

test('login issues a signed token only after valid password and omits the password', async () => {
  const passwordHash = await bcrypt.hash(registration.password, 4);
  User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userDocument({ password: passwordHash })) });

  const result = await authService.login({ email: registration.email, password: registration.password });

  expect(result.token).toEqual(expect.any(String));
  expect(result.user).not.toHaveProperty('password');
});

test('recovery response is generic and only sends a credential for existing accounts', async () => {
  User.findOne.mockReturnValue(query(null));
  const unknown = await authService.forgotPassword({ email: registration.email });
  User.findOne.mockReturnValue(query({ _id: userId, email: registration.email }));
  const known = await authService.forgotPassword({ email: registration.email });

  expect(unknown).toEqual(known);
  expect(otpManager.issue).toHaveBeenCalledWith(registration.email, expect.objectContaining({
    purpose: 'recovery',
    token: true
  }));
  expect(email.sendRecoveryEmail).toHaveBeenCalledTimes(1);
});

test('recovery delivery failures are logged without changing the generic response', async () => {
  const recovery = query({ _id: userId, email: registration.email });
  User.findOne.mockReturnValue(recovery);
  email.sendRecoveryEmail.mockRejectedValue(new Error('SMTP unavailable'));

  await expect(authService.forgotPassword({ email: registration.email }))
    .resolves.toEqual({ message: 'Nếu email đã đăng ký, hướng dẫn khôi phục mật khẩu sẽ được gửi đến hộp thư của bạn.' });

  expect(otpManager.invalidate).toHaveBeenCalledWith(registration.email, { purpose: 'recovery' });
  expect(logger.error).toHaveBeenCalledWith('Password recovery delivery failed', { error: 'SMTP unavailable' });
});

test('reset consumes the recovery credential, hashes the new password and sends a security notification', async () => {
  const user = userDocument();
  User.findOne.mockResolvedValue(user);

  await expect(authService.resetPassword({
    email: registration.email,
    token: 'valid-recovery-token',
    newPassword: 'NewStrong2!'
  })).resolves.toEqual({ message: 'Đặt lại mật khẩu thành công' });

  expect(otpManager.consume).toHaveBeenCalledWith(registration.email, 'valid-recovery-token', { purpose: 'recovery' });
  expect(user.password).toMatch(/^\$2/);
  expect(user.save).toHaveBeenCalledTimes(1);
  expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
    recipientId: userId,
    type: 'security'
  }));
});

test('change password requires the current password and the shared strong policy', async () => {
  const passwordHash = await bcrypt.hash(registration.password, 4);
  const user = userDocument({ password: passwordHash });
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

  await expect(authService.changePassword(userId, {
    currentPassword: 'incorrect',
    newPassword: 'NewStrong2!'
  })).rejects.toMatchObject({ statusCode: 400 });
  expect(user.save).not.toHaveBeenCalled();

  await expect(authService.changePassword(userId, {
    currentPassword: registration.password,
    newPassword: 'weak'
  })).rejects.toMatchObject({ statusCode: 400 });
  expect(user.save).not.toHaveBeenCalled();

  await expect(authService.changePassword(userId, {
    currentPassword: registration.password,
    newPassword: 'NewStrong2!'
  })).resolves.toEqual({ message: 'Đổi mật khẩu thành công' });
  expect(user.save).toHaveBeenCalledTimes(1);
});
