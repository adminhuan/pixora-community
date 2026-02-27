import { body } from 'express-validator';

export const createCommentValidator = [
  body('content').isString().isLength({ min: 1, max: 2000 }),
  body('targetType').isString().isLength({ min: 2, max: 20 }),
  body('targetId').isString().isLength({ min: 6 })
];

export const updateCommentValidator = [body('content').isString().isLength({ min: 1, max: 2000 })];

export const reportCommentValidator = [
  body('reason').optional().isIn(['spam', 'abuse', 'inappropriate', 'copyright', 'other']),
  body('description').optional().isString().isLength({ max: 500 })
];
