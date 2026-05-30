import type { FastifyReply, FastifyRequest } from 'fastify';
import { ERRORS } from '../helpers/errors.helper';
import { readSessionCookie } from '../helpers/session-cookie.helper';
import { logger } from '../helpers/logger.helper';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: {
      id: string;
      sessionId: string;
    };
  }
}

const unauthorized = (reply: FastifyReply) =>
  reply.status(ERRORS.unauthorizedAccess.statusCode).send({ message: ERRORS.unauthorizedAccess.message });

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const sessionId = readSessionCookie(request);
  if (!sessionId) {
    logger.warn({ path: request.url }, 'auth 401: no session cookie');
    return unauthorized(reply);
  }

  // TODO: look up session in Redis, resolve user from database
  // const userId = await authSessionService.getUserIdBySession(sessionId);
  // if (!userId) { ... }

  // Placeholder — set a stub so route handlers compile
  request.currentUser = {
    id: '',
    sessionId,
  };
};
