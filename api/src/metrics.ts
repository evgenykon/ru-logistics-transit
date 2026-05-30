import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const prismaQueryDuration = new Histogram({
  name: 'prisma_query_duration_ms',
  help: 'Prisma query duration in milliseconds',
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [registry],
});

export const prismaSlowQueriesTotal = new Counter({
  name: 'prisma_slow_queries_total',
  help: 'Total number of Prisma queries slower than 5 seconds',
  registers: [registry],
});

export { registry };
