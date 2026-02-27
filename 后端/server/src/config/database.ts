import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prismaClient = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' }
  ]
});

prismaClient.$on('query', (event) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Prisma Query', {
      query: event.query,
      duration: event.duration
    });
  }
});

export const prisma = prismaClient;

export const connectDatabase = async (): Promise<void> => {
  await prismaClient.$connect();
  logger.info('PostgreSQL connected');
};

export const disconnectDatabase = async (): Promise<void> => {
  await prismaClient.$disconnect();
  logger.info('PostgreSQL disconnected');
};

export default prismaClient;
