import type { FastifyInstance } from 'fastify';
import { getHealth } from '../controllers/health.controller';

export const healthRoutes = async (server: FastifyInstance) => {
  server.get('/health', { logLevel: 'silent' }, getHealth);
};
