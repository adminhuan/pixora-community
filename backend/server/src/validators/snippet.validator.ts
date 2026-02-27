import { body } from 'express-validator';

export const createSnippetValidator = [
  body('title').isString().isLength({ min: 2, max: 120 }),
  body('files').isArray({ min: 1 }),
  body('files.*.filename').isString(),
  body('files.*.content')
    .isString()
    .isLength({ min: 1, max: 100 * 1024 }),
  body('type').optional().isString().isIn(['component', 'snippet']),
  body('category')
    .optional()
    .isString()
    .isIn([
      'buttons',
      'cards',
      'loaders',
      'inputs',
      'toggles',
      'checkboxes',
      'forms',
      'patterns',
      'alerts',
      'modals',
      'navbars',
      'footers',
      'other'
    ]),
  body('framework').optional().isString().isIn(['css', 'tailwind', 'react', 'vue', 'svelte'])
];

export const updateSnippetValidator = [
  body('title').optional().isString().isLength({ min: 2, max: 120 }),
  body('files').optional().isArray({ min: 1 }),
  body('type').optional().isString().isIn(['component', 'snippet']),
  body('category')
    .optional()
    .isString()
    .isIn([
      'buttons',
      'cards',
      'loaders',
      'inputs',
      'toggles',
      'checkboxes',
      'forms',
      'patterns',
      'alerts',
      'modals',
      'navbars',
      'footers',
      'other'
    ]),
  body('framework').optional().isString().isIn(['css', 'tailwind', 'react', 'vue', 'svelte'])
];
