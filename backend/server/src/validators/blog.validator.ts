import { body } from 'express-validator';

export const createBlogValidator = [
  body('title').isString().isLength({ min: 2, max: 160 }),
  body('content').isString().isLength({ min: 10 })
];

export const updateBlogValidator = [
  body('title').optional().isString().isLength({ min: 2, max: 160 }),
  body('content').optional().isString().isLength({ min: 10 })
];

export const seriesValidator = [body('name').isString().isLength({ min: 2, max: 120 })];
