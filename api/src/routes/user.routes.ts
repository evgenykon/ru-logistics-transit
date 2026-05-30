import type { FastifyInstance } from 'fastify';
import { listUsers, createUser, updateUser, deleteUser, updateUserRoles } from '../controllers/user.controller';
import { requireAuth } from '../middleware/require-auth';

export const userRoutes = async (server: FastifyInstance) => {
  server.get('/users', { preHandler: [requireAuth] }, listUsers);
  server.post('/users', { preHandler: [requireAuth] }, createUser);
  server.put('/users/:id', { preHandler: [requireAuth] }, updateUser);
  server.delete('/users/:id', { preHandler: [requireAuth] }, deleteUser);
  server.put('/users/:id/roles', { preHandler: [requireAuth] }, updateUserRoles);
};
