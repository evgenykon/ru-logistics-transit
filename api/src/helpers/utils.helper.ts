import { randomBytes, createHash } from 'node:crypto';
import * as JWT from 'jsonwebtoken';
import Joi, { ObjectSchema } from 'joi';

export const utils = {
  isJSON: (data: string) => {
    try {
      JSON.parse(data);
    } catch {
      return false;
    }
    return true;
  },

  getTime: (): number => {
    return new Date().getTime();
  },

  getTokenFromHeader: (authorizationHeader: string | undefined): string | null => {
    if (!authorizationHeader) return null;
    const token = authorizationHeader.replace('Bearer ', '');
    return token || null;
  },

  verifyToken: (token: string, secret?: string): any => {
    return JWT.verify(token, (secret ?? process.env.APP_JWT_SECRET) as string);
  },

  createJwt(payload: any, secret: string): string {
    return JWT.sign(payload, secret, { expiresIn: '1h' });
  },

  isDevEnv(): boolean {
    return process.env.API_ENV === 'development';
  },

  getNumericIdParamsSchema(name: string): ObjectSchema<any> {
    return Joi.object({
      [`${name}`]: Joi.number().integer().max(2147483647).required(),
    });
  },

  parseRedisDsn(dsn: string | undefined) {
    if (!dsn) {
      throw new Error('parseBrokerDsn error: QUEUE_DSN environment variable is not set');
    }

    try {
      const url = new URL(dsn);

      if (url.protocol !== 'redis:') {
        throw new Error('Invalid protocol. Expected redis://');
      }

      const port = parseInt(url.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('parseBrokerDsn error: Port must be between 1 and 65535');
      }

      const hasUsername = !!url.username;
      const hasPassword = !!url.password;

      if (hasUsername && !hasPassword) {
        throw new Error('parseBrokerDsn error: Password is required when username is provided');
      }

      if (hasPassword && !hasUsername) {
        throw new Error('parseBrokerDsn error: Username is required when password is provided');
      }

      if (!url.hostname) {
        throw new Error('parseBrokerDsn error: Hostname is required');
      }

      return {
        host: url.hostname,
        port: port,
        username: url.username || undefined,
        password: url.password || undefined,
        tls: url.username ? {} : undefined,
      };
    } catch (error: any) {
      if (error instanceof TypeError) {
        throw new Error('parseBrokerDsn error: Invalid DSN format.');
      }
      throw new Error(`parseBrokerDsn error: Failed to parse DSN: ${error.message}`);
    }
  },

  getRandomInt(max: number, min: number = 0): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  generateRandomHex(bytes: number = 32): string {
    return randomBytes(bytes).toString('hex');
  },

  generateRandomBase64Url(bytes: number = 32): string {
    return randomBytes(bytes).toString('base64url');
  },

  hashString(str: string): string {
    return createHash('sha256').update(str, 'utf8').digest('hex');
  },
};
