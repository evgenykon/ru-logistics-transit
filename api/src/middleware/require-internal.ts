import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { ERRORS } from '../helpers/errors.helper';
import { logger } from '../helpers/logger.helper';

declare module 'fastify' {
  interface FastifyRequest {
    internalClient?: {
      sub: string;
    };
  }
}

const unauthorized = (reply: FastifyReply) =>
  reply.status(ERRORS.unauthorizedAccess.statusCode).send({ message: ERRORS.unauthorizedAccess.message });

export const requireInternal = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    logger.error('requireInternal: API_KEY not configured');
    return unauthorized(reply);
  }

  const authHeader = request.headers.authorization;
  if (!authHeader) {
    logger.warn({ path: request.url }, 'internal auth 401: no Authorization header');
    return unauthorized(reply);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn({ path: request.url }, 'internal auth 401: malformed Authorization header');
    return unauthorized(reply);
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, apiKey, { algorithms: ['HS256'] }) as { sub: string };
    request.internalClient = { sub: payload.sub };
  } catch (err) {
    logger.warn({ path: request.url, err }, 'internal auth 401: invalid JWT');
    return unauthorized(reply);
  }
};
