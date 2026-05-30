import Joi from 'joi';

export const createRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('').max(255).optional(),
  permissionIds: Joi.array().items(Joi.string()).default([]),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('').max(255).optional(),
  permissionIds: Joi.array().items(Joi.string()).default([]),
});

export const roleParamsSchema = Joi.object({
  id: Joi.string().required(),
});
