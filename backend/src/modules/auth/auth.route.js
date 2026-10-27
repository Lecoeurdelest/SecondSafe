const express = require('express');
const { loginLimiter, codeRequestLimiter, codeVerificationLimiter, recoveryLimiter } = require('../../common/middlewares/rate-limit.middleware');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const controller = require('./auth.controller');

const router = express.Router();

router.post('/login', loginLimiter, controller.login);
router.post('/register/request-otp', codeRequestLimiter, controller.requestRegistrationCode);
router.post('/register/verify', codeVerificationLimiter, controller.verifyRegistration);
router.post('/forgot-password', recoveryLimiter, controller.forgotPassword);
router.post('/reset-password', recoveryLimiter, controller.resetPassword);
router.post('/change-password', authenticate, controller.changePassword);
router.post('/logout', authenticate, controller.logout);

module.exports = router;
