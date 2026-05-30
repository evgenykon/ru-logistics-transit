import type { FastifyReply, FastifyRequest } from 'fastify';
import Joi from 'joi';
import { handleServerError } from './errors.helper';

const validate = (schema: Joi.ObjectSchema, source: 'body' | 'params' | 'query') => {
  return (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    try {
      const { error } = schema.validate(request[source]);
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

export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params');
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body');
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query');

export function withErrorHandler(handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await handler(request, reply);
    } catch (err) {
      handleServerError(reply, err);
    }
  };
}
