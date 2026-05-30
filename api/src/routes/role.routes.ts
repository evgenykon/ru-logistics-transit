import type { FastifyInstance } from 'fastify';
import { listRoles, createRole, updateRole, deleteRole } from '../controllers/role.controller';
import { listPermissions } from '../controllers/permission.controller';
import { createRoleSchema, updateRoleSchema, roleParamsSchema } from '../schemas/role.schema';
import { validateBody, validateParams } from '../helpers/validation.helper';
import { requireAuth } from '../middleware/require-auth';

export const roleRoutes = async (server: FastifyInstance) => {
  server.get('/roles', { preHandler: [requireAuth] }, listRoles);
  server.post('/roles', {
    preHandler: [requireAuth, validateBody(createRoleSchema)],
  }, createRole);
  server.put('/roles/:id', {
    preHandler: [requireAuth, validateParams(roleParamsSchema), validateBody(updateRoleSchema)],
  }, updateRole);
  server.delete('/roles/:id', {
    preHandler: [requireAuth, validateParams(roleParamsSchema)],
  }, deleteRole);

  server.get('/permissions', { preHandler: [requireAuth] }, listPermissions);
};
