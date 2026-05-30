import { PrismaClient } from '@prisma/client';
import { logger } from './helpers/logger.helper';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaQueryDuration, prismaSlowQueriesTotal } from './metrics';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
export const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
  ],
});

prisma.$on('query', (e) => {
  prismaQueryDuration.observe(e.duration);

  const queryLogLevel: string = process.env.DATABASE_QUERY_LOG_LEVEL ?? 'info';
  if (!['warn', 'info', 'debug'].includes(queryLogLevel)) {
    return;
  }
  if (e.duration > 5000) {
    prismaSlowQueriesTotal.inc();
    logger.warn(
      {
        query: e.query.replace(/"/g, ''),
        params: e.params,
        duration: e.duration,
      },
      'Prisma SLOW query',
    );
  } else {
    if (!['info', 'debug'].includes(queryLogLevel)) {
      return;
    }
    logger.info(
      {
        query: e.query.replace(/"/g, ''),
        params: e.params,
        duration: e.duration,
      },
      'Prisma query',
    );
  }
});

export default prisma;
