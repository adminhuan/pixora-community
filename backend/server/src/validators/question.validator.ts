import { body } from 'express-validator';

export const createQuestionValidator = [
  body('title').isString().isLength({ min: 5, max: 150 }),
  body('content').isString().isLength({ min: 10 })
];

export const updateQuestionValidator = [
  body('title').optional().isString().isLength({ min: 5, max: 150 }),
  body('content').optional().isString().isLength({ min: 10 })
];

export const answerValidator = [body('content').isString().isLength({ min: 2 })];

export const voteValidator = [body('value').isInt({ min: -1, max: 1 })];
