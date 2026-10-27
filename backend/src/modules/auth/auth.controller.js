const authService = require('./auth.service');
const logger = require('../../common/utils/logger.util');
const { sendSuccess, sendError } = require('../../common/utils/response.util');
const otpManager = require('../../common/utils/otp.manager');
const { sendLogin2faOtpEmail } = require('../../common/utils/email.util');

function respondError(res, error, operation) {
  const status = Number(error.statusCode);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    const response = { success: false, message: error.message };
    if (error.details) response.data = error.details;
    return res.status(status).json(response);
  }
  logger.error(operation, { error: error.message });
  const statusCode = Number.isInteger(status) && status >= 500 && status <= 599 ? status : 500;
  const message = error.expose === true ? error.message : 'Lỗi hệ thống, vui lòng thử lại sau';
  return sendError(res, statusCode, message);
}

async function requestRegistrationCode(req, res) {
  try {
    const result = await authService.requestRegistrationCode(req.body);
    return sendSuccess(res, 202, result, 'Mã xác thực đã được gửi đến email của bạn');
  } catch (error) {
    return respondError(res, error, 'Registration code request failed');
  }
}

async function verifyRegistration(req, res) {
  try {
    const result = await authService.verifyRegistration({ ...req.body, code: req.body.code ?? req.body.otpCode });
    return sendSuccess(res, 201, result, 'Đăng ký tài khoản thành công');
  } catch (error) {
    return respondError(res, error, 'Registration verification failed');
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    if (result.requires2FA) {
      const code = await otpManager.generateAndSaveOtp(result.user.email, {
        purpose: 'login_2fa', userId: result.user.id || result.user._id
      }, 'login-2fa');
      await sendLogin2faOtpEmail(result.user.email, code);
      return sendSuccess(res, 200, { requires2FA: true, email: result.user.email }, 'Mã xác thực đã được gửi đến email của bạn');
    }
    return sendSuccess(res, 200, result, 'Đăng nhập thành công');
  } catch (error) {
    return respondError(res, error, 'Login failed');
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, 202, result);
  } catch (error) {
    return respondError(res, error, 'Password recovery request failed');
  }
}

async function resetPassword(req, res) {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, 200, result, result.message);
  } catch (error) {
    return respondError(res, error, 'Password reset failed');
  }
}

async function changePassword(req, res) {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    return sendSuccess(res, 200, result, result.message);
  } catch (error) {
    return respondError(res, error, 'Password change failed');
  }
}

function logout(req, res) {
  return sendSuccess(res, 200, null, 'Đăng xuất thành công');
}

async function googleLogin(req, res) {
  try {
    if (!req.body.idToken) return sendError(res, 400, 'Vui lòng cung cấp idToken của Google');
    return sendSuccess(res, 200, await authService.loginWithGoogle(req.body.idToken), 'Đăng nhập Google thành công');
  } catch (error) {
    return respondError(res, error, 'Google login failed');
  }
}

async function getProfile(req, res) {
  try {
    return sendSuccess(res, 200, await authService.getUserById(req.user.userId));
  } catch (error) {
    return respondError(res, error, 'Profile request failed');
  }
}

async function verifyLogin2FA(req, res) {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) return sendError(res, 400, 'Vui lòng cung cấp email và mã OTP');
    const result = await otpManager.verifyOtp(email, otpCode, 'login-2fa');
    if (!result.valid || result.userData?.purpose !== 'login_2fa') {
      return sendError(res, 400, 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    }
    return sendSuccess(res, 200, await authService.complete2FALogin(result.userData.userId));
  } catch (error) {
    return respondError(res, error, 'Two-factor login failed');
  }
}

module.exports = {
  requestRegisterOtp: requestRegistrationCode,
  verifyAndRegister: verifyRegistration,
  googleLogin, getProfile, verifyLogin2FA,
  requestRegistrationCode,
  verifyRegistration,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
};
