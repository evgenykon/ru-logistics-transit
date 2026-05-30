import type { FastifyInstance } from 'fastify';
import { listOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../controllers/organization.controller';
import { requireAuth } from '../middleware/require-auth';

export const organizationRoutes = async (server: FastifyInstance) => {
  server.get('/organizations', { preHandler: [requireAuth] }, listOrganizations);
  server.post('/organizations', { preHandler: [requireAuth] }, createOrganization);
  server.put('/organizations/:id', { preHandler: [requireAuth] }, updateOrganization);
  server.delete('/organizations/:id', { preHandler: [requireAuth] }, deleteOrganization);
};
