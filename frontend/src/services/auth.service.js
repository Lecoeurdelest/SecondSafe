import api from './api';

async function requestData(request) {
  const response = await request;
  return response.data.data;
}

const authService = {
  login: (data, password) => requestData(api.post('/auth/login', typeof data === 'string' ? { email: data, password } : data)),
  requestRegistrationCode: data => requestData(api.post('/auth/register/request-otp', data)),
  verifyRegistration: data => requestData(api.post('/auth/register/verify', data)),
  forgotPassword: data => requestData(api.post('/auth/forgot-password', typeof data === 'string' ? { email: data } : data)),
  resetPassword: data => requestData(api.post('/auth/reset-password', data)),
  changePassword: (data, newPassword) => requestData(api.post('/auth/change-password', typeof data === 'string' ? { currentPassword: data, newPassword } : data)),
  logout: () => requestData(api.post('/auth/logout')),
  getProfile: token => requestData(api.get('/auth/profile', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)),
  loginWithGoogle: idToken => requestData(api.post('/auth/google', { idToken })),
  verifyLogin2FA: (email, otpCode) => requestData(api.post('/auth/login/verify-2fa', { email, otpCode })),
  requestRegisterOtp: (email, password, fullName, phone, address) =>
    requestData(api.post('/auth/register/request-otp', { email, password, fullName, phone, address })),
  verifyAndRegister: (email, otpCode) => requestData(api.post('/auth/register/verify', { email, otpCode }))
};

export { authService };
export default authService;
