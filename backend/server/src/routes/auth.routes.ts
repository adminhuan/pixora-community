import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';
import { requireCsrfToken } from '../middleware/csrf';
import {
  authRateLimiter,
  authTokenRateLimiter,
  captchaRateLimiter,
  emailCodeRateLimiter,
  passwordResetRateLimiter,
  smsCodeRateLimiter
} from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';
import {
  changePasswordValidator,
  checkEmailValidator,
  checkUsernameValidator,
  exchangeTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  sendEmailCodeValidator,
  sendSmsCodeValidator
} from '../validators/auth.validator';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, registerValidator, validateRequest, authController.register);
authRoutes.post('/login', authRateLimiter, loginValidator, validateRequest, authController.login);
authRoutes.post('/logout', requireCsrfToken, authController.logout);
authRoutes.post(
  '/refresh-token',
  authTokenRateLimiter,
  requireCsrfToken,
  refreshTokenValidator,
  validateRequest,
  authController.refreshToken
);
authRoutes.post(
  '/forgot-password',
  passwordResetRateLimiter,
  forgotPasswordValidator,
  validateRequest,
  authController.forgotPassword
);
authRoutes.post(
  '/reset-password',
  passwordResetRateLimiter,
  resetPasswordValidator,
  validateRequest,
  authController.resetPassword
);
authRoutes.put('/change-password', auth, changePasswordValidator, validateRequest, authController.changePassword);
authRoutes.post(
  '/send-email-code',
  emailCodeRateLimiter,
  sendEmailCodeValidator,
  validateRequest,
  authController.sendEmailCode
);
authRoutes.post(
  '/send-sms-code',
  smsCodeRateLimiter,
  sendSmsCodeValidator,
  validateRequest,
  authController.sendSmsCode
);
authRoutes.get('/captcha', captchaRateLimiter, authController.captcha);
authRoutes.get('/github', authRateLimiter, authController.github);
authRoutes.get('/github/callback', authRateLimiter, authController.githubCallback);
authRoutes.get('/wechat', authRateLimiter, authController.wechat);
authRoutes.get('/wechat/callback', authRateLimiter, authController.wechatCallback);
authRoutes.get(
  '/check-username',
  authRateLimiter,
  checkUsernameValidator,
  validateRequest,
  authController.checkUsername
);
authRoutes.get('/check-email', authRateLimiter, checkEmailValidator, validateRequest, authController.checkEmail);
authRoutes.post(
  '/exchange-token',
  authTokenRateLimiter,
  exchangeTokenValidator,
  validateRequest,
  authController.exchangeToken
);
