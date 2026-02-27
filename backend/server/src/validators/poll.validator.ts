import { body } from 'express-validator';

export const votePollValidator = [body('optionId').isString().trim().isLength({ min: 1, max: 64 })];
