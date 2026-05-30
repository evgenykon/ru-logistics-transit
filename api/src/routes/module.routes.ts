import type { FastifyInstance } from 'fastify';
import { listModules, getModule, createModule, updateModule, deleteModule } from '../controllers/module.controller';
import { createModuleSchema, updateModuleSchema, moduleIdSchema } from '../schemas/module.schema';
import { validateBody, validateParams } from '../helpers/validation.helper';
import { requireAuth } from '../middleware/require-auth';

export const moduleRoutes = async (server: FastifyInstance) => {
  server.get('/modules', { preHandler: [requireAuth] }, listModules);

  server.get('/modules/:id', {
    preHandler: [requireAuth, validateParams(moduleIdSchema)],
  }, getModule);

  server.post('/modules', {
    preHandler: [requireAuth, validateBody(createModuleSchema)],
  }, createModule);

  server.put('/modules/:id', {
    preHandler: [requireAuth, validateParams(moduleIdSchema), validateBody(updateModuleSchema)],
  }, updateModule);

  server.delete('/modules/:id', {
    preHandler: [requireAuth, validateParams(moduleIdSchema)],
  }, deleteModule);
};
