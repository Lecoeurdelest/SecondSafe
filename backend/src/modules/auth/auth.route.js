const express = require('express');
const { loginLimiter, codeRequestLimiter, codeVerificationLimiter, recoveryLimiter } = require('../../common/middlewares/rate-limit.middleware');

const router = express.Router();

router.post('/login', loginLimiter);
router.post('/register/request-otp', codeRequestLimiter);
router.post(['/register/verify', '/login/verify-2fa'], codeVerificationLimiter);
router.post(['/forgot-password', '/reset-password'], recoveryLimiter);

module.exports = router;
