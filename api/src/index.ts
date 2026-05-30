import Fastify, { type RawServerDefault } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCookie from '@fastify/cookie';
import Redis from 'ioredis';
import { logger } from './helpers/logger.helper';
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { moduleRoutes } from './routes/module.routes';
import { roleRoutes } from './routes/role.routes';
import { userRoutes } from './routes/user.routes';
import { organizationRoutes } from './routes/organization.routes';
import { registry } from './metrics';

const server = Fastify<RawServerDefault>({
  loggerInstance: logger,
  trustProxy: true,
});

const apiKey = (process.env.API_KEY ?? '').trim();
const WEAK_API_KEYS = new Set(['api-dev', 'dev', 'test', 'secret', 'changeme', 'change-me']);
if (apiKey.length < 32 || WEAK_API_KEYS.has(apiKey.toLowerCase())) {
  logger.error(
    'API_KEY is missing, shorter than 32 chars, or a known weak placeholder. Set a 32+ char random value (e.g. `openssl rand -base64 32`).',
  );
  process.exit(1);
}

const rateLimitRedis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
  connectTimeout: 500,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});
rateLimitRedis.on('error', (err) => {
  logger.error({ msg: 'Rate-limit Redis error:', err });
});

server.register(fastifyRateLimit, {
  global: false,
  redis: rateLimitRedis,
});

server.register(fastifyCookie);

server.get('/metrics', async (req, reply) => {
  reply.header('Content-Type', registry.contentType);
  reply.send(await registry.metrics());
});

server.register(healthRoutes);
server.register(authRoutes);
server.register(moduleRoutes);
server.register(roleRoutes);
server.register(userRoutes);
server.register(organizationRoutes);

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
