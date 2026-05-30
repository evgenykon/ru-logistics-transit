import Joi from 'joi';

export const createModuleSchema = Joi.object({
  key: Joi.string().min(2).max(64).required(),
  name: Joi.string().min(1).max(128).required(),
  description: Joi.string().max(512).allow('', null),
  icon: Joi.string().max(1024).required(),
  route: Joi.string().max(128).required(),
  order: Joi.number().integer().min(0).default(0),
});

export const updateModuleSchema = Joi.object({
  name: Joi.string().min(1).max(128),
  description: Joi.string().max(512).allow('', null),
  icon: Joi.string().max(1024),
  route: Joi.string().max(128),
  enabled: Joi.boolean(),
  order: Joi.number().integer().min(0),
});

export const moduleIdSchema = Joi.object({
  id: Joi.string().required(),
});
