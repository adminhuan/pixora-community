import { body } from 'express-validator';

export const createPostValidator = [
  body('title').isString().isLength({ min: 3, max: 120 }),
  body('content').isString().isLength({ min: 10 })
];

export const updatePostValidator = [
  body('title').optional().isString().isLength({ min: 3, max: 120 }),
  body('content').optional().isString().isLength({ min: 10 })
];
