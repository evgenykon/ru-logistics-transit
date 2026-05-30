import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import { handleServerError } from '../helpers/errors.helper';

export async function listPermissions(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: { name: 'asc' } });
    return reply.send(permissions);
  } catch (err) {
    handleServerError(reply, err);
  }
}
