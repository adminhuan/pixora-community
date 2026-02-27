import { query } from 'express-validator';

export const rankingQueryValidator = [
  query('type').optional().isIn(['total', 'contribution', 'creation', 'project', 'newstar']),
  query('period').optional().isIn(['week', 'month', 'all']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];
