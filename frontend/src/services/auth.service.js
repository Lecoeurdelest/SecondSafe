import api from './api';

async function requestData(request) {
  const response = await request;
  return response.data.data;
}

const authService = {
  login: data => requestData(api.post('/auth/login', data)),
  requestRegistrationCode: data => requestData(api.post('/auth/register/request-otp', data)),
  verifyRegistration: data => requestData(api.post('/auth/register/verify', data)),
  forgotPassword: data => requestData(api.post('/auth/forgot-password', data)),
  resetPassword: data => requestData(api.post('/auth/reset-password', data)),
  changePassword: data => requestData(api.post('/auth/change-password', data)),
  logout: () => requestData(api.post('/auth/logout'))
};

export default authService;
