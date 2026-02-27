import { body } from 'express-validator';

const PROJECT_STATUS_VALUES = ['developing', 'completed', 'maintained', 'deprecated'] as const;

export const createProjectValidator = [
  body('name').isString().isLength({ min: 2, max: 120 }),
  body('description').isString().isLength({ min: 2, max: 300 }),
  body('content').isString().isLength({ min: 10 }),
  body('status').optional().isIn(PROJECT_STATUS_VALUES),
  body('coverImage').optional({ nullable: true }).isString()
];

export const updateProjectValidator = [
  body('name').optional().isString().isLength({ min: 2, max: 120 }),
  body('description').optional().isString().isLength({ min: 2, max: 300 }),
  body('content').optional().isString().isLength({ min: 10 }),
  body('status').optional().isIn(PROJECT_STATUS_VALUES),
  body('coverImage').optional({ nullable: true }).isString()
];
