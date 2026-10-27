const authService = require('./auth.service');
const logger = require('../../common/utils/logger.util');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

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
    const result = await authService.verifyRegistration(req.body);
    return sendSuccess(res, 201, result, 'Đăng ký tài khoản thành công');
  } catch (error) {
    return respondError(res, error, 'Registration verification failed');
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
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

module.exports = {
  requestRegistrationCode,
  verifyRegistration,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
};
