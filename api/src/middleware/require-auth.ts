import type { FastifyReply, FastifyRequest } from 'fastify';
import { ERRORS } from '../helpers/errors.helper';
import { readSessionCookie } from '../helpers/session-cookie.helper';
import { logger } from '../helpers/logger.helper';
import { cache } from '../cache';
import { prisma } from '../db';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: {
      id: string;
      sessionId: string;
    };
  }
}

const SESSION_TTL = 86400;

const unauthorized = (reply: FastifyReply) =>
  reply.status(ERRORS.unauthorizedAccess.statusCode).send({ message: ERRORS.unauthorizedAccess.message });

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const sessionId = readSessionCookie(request);
  if (!sessionId) {
    logger.warn({ path: request.url }, 'auth 401: no session cookie');
    return unauthorized(reply);
  }

  const userId = await cache.get(`session:${sessionId}`);
  if (!userId) {
    logger.warn({ path: request.url }, 'auth 401: session not found in Redis');
    return unauthorized(reply);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    logger.warn({ path: request.url, sessionId }, 'auth 401: user not found');
    return unauthorized(reply);
  }

  await cache.expire(`session:${sessionId}`, SESSION_TTL);

  request.currentUser = {
    id: user.id,
    sessionId,
  };
};
