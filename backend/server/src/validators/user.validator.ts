import { body } from 'express-validator';

export const updateProfileValidator = [
  body('username').optional().isString().trim().isLength({ min: 2, max: 32 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('nickname').optional().isString().isLength({ min: 1, max: 64 }),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('signature').optional().isString().isLength({ max: 120 })
];

export const updateSettingsValidator = [body('notificationSettings').optional().isObject()];

export const favoriteFolderValidator = [body('name').isString().isLength({ min: 1, max: 50 })];
