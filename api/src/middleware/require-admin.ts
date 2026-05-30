import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: string;
  }
}

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const user = request.headers['x-forwarded-user'];
  if (typeof user !== 'string' || user.length === 0) {
    reply.status(403).send({ message: 'Forbidden' });
    return;
  }
  request.adminUser = user;
};
