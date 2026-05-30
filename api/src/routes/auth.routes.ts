import type { FastifyInstance } from 'fastify';
import { login, logout, me, changePassword } from '../controllers/auth.controller';
import { loginSchema, changePasswordSchema } from '../schemas/auth.schema';
import { validateBody } from '../helpers/validation.helper';
import { requireAuth } from '../middleware/require-auth';

export const authRoutes = async (server: FastifyInstance) => {
  server.post('/auth/login', {
    preHandler: [validateBody(loginSchema)],
  }, login);

  server.post('/auth/logout', logout);

  server.get('/auth/me', { preHandler: [requireAuth] }, me);

  server.put('/auth/password', {
    preHandler: [requireAuth, validateBody(changePasswordSchema)],
  }, changePassword);
};
