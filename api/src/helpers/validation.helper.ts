import type { FastifyReply, FastifyRequest } from 'fastify';
import Joi from 'joi';
import { handleServerError } from './errors.helper';

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    try {
      const { error } = schema.validate(request.params);
      if (error) {
        throw error;
      }
      done();
    } catch (error) {
      if (error instanceof Error) {
        return done(error);
      }
      done(new Error('Unknown validation error'));
    }
  };
};

export function withErrorHandler(handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await handler(request, reply);
    } catch (err) {
      handleServerError(reply, err);
    }
  };
}
