import type { FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { logger } from './logger.helper';

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const ERRORS = {
  invalidToken: new AppError('Token is invalid.', 401),
  userExists: new AppError('User already exists', 409),
  userNotExists: new AppError('User not exists', 404),
  userCredError: new AppError('Invalid credential', 401),
  tokenError: new AppError('Invalid Token', 401),
  invalidRequest: new AppError('Invalid request', 400),
  internalServerError: new AppError('Internal Server Error', 500),
  unauthorizedAccess: new AppError('Unauthorized access', 401),
  notFound: new AppError('Not found', 404),
};

export function handleServerError(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    logger.error(error, 'AppError:');
    return reply.status(error.statusCode).send({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    logger.error(error, 'PrismaClientKnownRequestError P2025:');
    return reply.status(ERRORS.notFound.statusCode).send({ message: ERRORS.notFound.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    logger.error(error, 'PrismaClientKnownRequestError P2002 (unique constraint):');
    return reply.status(409).send({ message: 'Запись с таким значением уже существует' });
  }

  logger.error(error, 'Internal Server Error:');
  return reply.status(ERRORS.internalServerError.statusCode).send(ERRORS.internalServerError.message);
}
