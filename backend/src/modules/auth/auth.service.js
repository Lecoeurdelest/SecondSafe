const bcrypt = require('bcryptjs');
const User = require('../users/user.model');
const Notification = require('../notifications/notification.model');
const { generateJWT } = require('../../common/utils/jwt.util');
const otpManager = require('../../common/utils/otp.manager');
const { sendRegisterOtpEmail, sendRecoveryEmail } = require('../../common/utils/email.util');
const { validateStrongPassword } = require('../../common/validators/password.validator');
const logger = require('../../common/utils/logger.util');
const business = require('../../config/business');

const GENERIC_CREDENTIAL_ERROR = 'Email hoặc mật khẩu không chính xác';
const RECOVERY_MESSAGE = 'Nếu email đã đăng ký, hướng dẫn khôi phục mật khẩu sẽ được gửi đến hộp thư của bạn.';
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('secondsafe-invalid-login', 12);

function normalizedEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validEmail(email) {
  return /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email);
}

function safeUser(user) {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  delete result.__v;
  return result;
}

function validateRegistration(data) {
  const email = normalizedEmail(data.email);
  const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  if (!email || !validEmail(email) || !fullName || fullName.length > 100 || !/^0\d{9,10}$/.test(phone)) {
    throw Object.assign(new Error('Vui lòng nhập họ tên, email hợp lệ và số điện thoại hợp lệ'), { statusCode: 400 });
  }
  validateStrongPassword(data.password);
  return { email, fullName, phone };
}

async function requestRegistrationCode(data = {}) {
  const registration = validateRegistration(data);
  const existing = await User.findOne({
    $or: [{ email: registration.email }, { phone: registration.phone }]
  }).select('_id').lean();
  if (existing) {
    throw Object.assign(new Error('Email hoặc số điện thoại đã được đăng ký'), { statusCode: 400 });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const payload = { ...registration, passwordHash };
  const code = await otpManager.issue(registration.email, { purpose: 'register', payload });
  try {
    await sendRegisterOtpEmail(registration.email, code);
  } catch (error) {
    await otpManager.invalidate(registration.email, { purpose: 'register' });
    throw error;
  }
  return { email: registration.email };
}

async function verifyRegistration(data = {}) {
  const email = normalizedEmail(data.email);
  if (!validEmail(email) || typeof data.code !== 'string') {
    throw Object.assign(new Error('Email hoặc mã xác thực không hợp lệ'), { statusCode: 400 });
  }
  const verification = await otpManager.consume(email, data.code, { purpose: 'register' });
  if (!verification.valid || !verification.payload) {
    throw Object.assign(new Error('Mã xác thực không hợp lệ hoặc đã hết hạn'), { statusCode: 400 });
  }

  const { passwordHash, ...profile } = verification.payload;
  if (profile.email !== email || typeof passwordHash !== 'string' || !passwordHash.startsWith('$2')) {
    throw Object.assign(new Error('Thông tin đăng ký không hợp lệ'), { statusCode: 400 });
  }
  const user = await User.create({ ...profile, password: passwordHash, role: 'user' });
  return { token: generateJWT({ userId: String(user._id) }), user: safeUser(user) };
}

async function login(data = {}) {
  const email = normalizedEmail(data.email);
  const password = typeof data.password === 'string' ? data.password : '';
  const user = validEmail(email)
    ? await User.findOne({ email }).select('+password')
    : null;
  const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) {
    throw Object.assign(new Error(GENERIC_CREDENTIAL_ERROR), { statusCode: 401 });
  }

  if (user.isSuspended) {
    const suspensionEnds = user.suspendedUntil ? new Date(user.suspendedUntil).getTime() : null;
    if (suspensionEnds === null || !Number.isFinite(suspensionEnds) || suspensionEnds > Date.now()) {
      throw Object.assign(new Error('Tài khoản đang bị tạm khóa'), {
        statusCode: 403,
        details: { suspendedUntil: user.suspendedUntil || null, reason: user.suspendedReason || null }
      });
    }
    user.isSuspended = false;
    user.suspendedUntil = undefined;
    user.suspendedReason = undefined;
    await user.save();
  }

  return { token: generateJWT({ userId: String(user._id) }), user: safeUser(user) };
}

async function forgotPassword(data = {}) {
  const email = normalizedEmail(data.email);
  if (!validEmail(email)) {
    throw Object.assign(new Error('Địa chỉ email không hợp lệ'), { statusCode: 400 });
  }

  const user = await User.findOne({ email }).select('_id email').lean();
  if (user) {
    try {
      const credential = await otpManager.issue(email, {
        purpose: 'recovery',
        token: true,
        ttlMs: business.resetCredentialTtlMs
      });
      await sendRecoveryEmail(email, credential);
    } catch (error) {
      logger.error('Password recovery delivery failed', { error: error.message });
      try {
        await otpManager.invalidate(email, { purpose: 'recovery' });
      } catch (cleanupError) {
        logger.error('Password recovery credential cleanup failed', { error: cleanupError.message });
      }
    }
  }
  return { message: RECOVERY_MESSAGE };
}

async function resetPassword(data = {}) {
  const email = normalizedEmail(data.email);
  validateStrongPassword(data.newPassword);
  if (!validEmail(email) || typeof data.token !== 'string') {
    throw Object.assign(new Error('Thông tin khôi phục không hợp lệ'), { statusCode: 400 });
  }

  const verification = await otpManager.consume(email, data.token, { purpose: 'recovery' });
  if (!verification.valid) {
    throw Object.assign(new Error('Mã khôi phục không hợp lệ hoặc đã hết hạn'), { statusCode: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw Object.assign(new Error('Mã khôi phục không hợp lệ hoặc đã hết hạn'), { statusCode: 400 });
  }
  user.password = await bcrypt.hash(data.newPassword, 12);
  await user.save();

  try {
    await Notification.create({
      recipientId: user._id,
      type: 'security',
      title: 'Mật khẩu đã được thay đổi',
      message: 'Mật khẩu tài khoản SecondSafe của bạn vừa được đặt lại.'
    });
  } catch (error) {
    logger.error('Password reset security notification failed', { error: error.message });
  }
  return { message: 'Đặt lại mật khẩu thành công' };
}

async function changePassword(userId, data = {}) {
  if (typeof data.currentPassword !== 'string' || typeof data.newPassword !== 'string') {
    throw Object.assign(new Error('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'), { statusCode: 400 });
  }
  validateStrongPassword(data.newPassword);

  const user = await User.findById(userId).select('+password');
  if (!user || !(await bcrypt.compare(data.currentPassword, user.password))) {
    throw Object.assign(new Error('Mật khẩu hiện tại không chính xác'), { statusCode: 400 });
  }
  user.password = await bcrypt.hash(data.newPassword, 12);
  await user.save();
  return { message: 'Đổi mật khẩu thành công' };
}

module.exports = {
  requestRegistrationCode,
  verifyRegistration,
  login,
  forgotPassword,
  resetPassword,
  changePassword
};
