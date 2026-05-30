import type { FastifyReply, FastifyRequest } from 'fastify';

export const SESSION_COOKIE_NAME = 'session';

const isProd = () => process.env.NODE_ENV === 'production';

export const setSessionCookie = (reply: FastifyReply, sessionId: string): void => {
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd(),
    path: '/',
    maxAge: 86400,
  });
};

export const clearSessionCookie = (reply: FastifyReply): void => {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
};

export const readSessionCookie = (request: FastifyRequest): string | null => {
  const raw = request.cookies?.[SESSION_COOKIE_NAME];
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};
