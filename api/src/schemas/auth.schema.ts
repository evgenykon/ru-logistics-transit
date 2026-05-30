import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().min(1).required(),
  password: Joi.string().min(1).required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required(),
  newPassword: Joi.string().min(4).required(),
});
