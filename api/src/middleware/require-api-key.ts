import type { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { ERRORS } from '../helpers/errors.helper';
import { logger } from '../helpers/logger.helper';

declare module 'fastify' {
  interface FastifyRequest {
    currentApiKey?: {
      id: string;
      name: string;
    };
  }
}

const PREFIX_LENGTH = 8;
const API_KEY_HEADER = 'x-api-key';

const unauthorized = (reply: FastifyReply) =>
  reply.status(ERRORS.unauthorizedAccess.statusCode).send({ message: ERRORS.unauthorizedAccess.message });

export const requireApiKey = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const apiKey = request.headers[API_KEY_HEADER];
  if (typeof apiKey !== 'string' || apiKey.length < PREFIX_LENGTH) {
    logger.warn({ path: request.url }, 'api-key auth 401: missing or too short');
    return unauthorized(reply);
  }

  const prefix = apiKey.slice(0, PREFIX_LENGTH);

  const record = await prisma.apiKey.findUnique({ where: { prefix } });
  if (!record) {
    logger.warn({ path: request.url }, `api-key auth 401: prefix ${prefix} not found`);
    return unauthorized(reply);
  }

  if (!record.active) {
    logger.warn({ path: request.url, keyId: record.id }, 'api-key auth 401: key is inactive');
    return unauthorized(reply);
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    logger.warn({ path: request.url, keyId: record.id }, 'api-key auth 401: key expired');
    return unauthorized(reply);
  }

  const valid = await bcrypt.compare(apiKey, record.keyHash);
  if (!valid) {
    logger.warn({ path: request.url, keyId: record.id }, 'api-key auth 401: hash mismatch');
    return unauthorized(reply);
  }

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  request.currentApiKey = { id: record.id, name: record.name };
};
