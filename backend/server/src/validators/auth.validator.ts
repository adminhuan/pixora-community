import { body, query } from 'express-validator';

export const registerValidator = [
  body('username').isString().trim().isLength({ min: 2, max: 32 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 64 }),
  body('emailCode').isString().trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('邮箱验证码为6位数字')
];

export const loginValidator = [
  body('identifier').isString().trim().isLength({ min: 2, max: 100 }),
  body('password').isString().isLength({ min: 6, max: 64 })
];

export const refreshTokenValidator = [
  body('refreshToken').optional().isString().trim().isLength({ min: 16, max: 4096 })
];

export const forgotPasswordValidator = [body('email').isEmail().normalizeEmail()];

export const resetPasswordValidator = [
  body('token').isString().trim().notEmpty(),
  body('password').isString().isLength({ min: 8, max: 64 })
];

export const changePasswordValidator = [
  body('oldPassword').isString().isLength({ min: 6, max: 64 }),
  body('newPassword').isString().isLength({ min: 8, max: 64 })
];

export const sendEmailCodeValidator = [
  body('email').isEmail().normalizeEmail(),
  body('captchaId').isUUID(),
  body('captchaCode').isString().trim().isLength({ min: 1, max: 16 })
];

export const sendSmsCodeValidator = [
  body('phone')
    .isString()
    .trim()
    .matches(/^\+?[0-9]{6,20}$/)
];

export const checkUsernameValidator = [query('username').isString().trim().isLength({ min: 2, max: 32 })];

export const checkEmailValidator = [query('email').isEmail().normalizeEmail()];

export const exchangeTokenValidator = [body('token').isString().trim().isLength({ min: 16, max: 4096 })];
