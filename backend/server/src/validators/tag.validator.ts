import { body } from 'express-validator';

export const adminTagCreateValidator = [body('name').isString().isLength({ min: 1, max: 50 })];
