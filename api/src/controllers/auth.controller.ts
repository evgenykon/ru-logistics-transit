import type { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { cache } from '../cache';
import { setSessionCookie, clearSessionCookie, readSessionCookie } from '../helpers/session-cookie.helper';
import { generateAccessToken } from '../helpers/token-generator.helper';
import { handleServerError, ERRORS } from '../helpers/errors.helper';
import { logger } from '../helpers/logger.helper';

const SESSION_TTL = 86400;

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = request.body as { email: string; password: string };

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user || !user.password || !user.active) {
      return reply.status(401).send({ message: 'Неверный логин или пароль' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ message: 'Неверный логин или пароль' });
    }

    const sessionId = generateAccessToken();
    await cache.set(`session:${sessionId}`, user.id, SESSION_TTL);

    setSessionCookie(reply, sessionId);

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions.map((rp) => rp.permission.name),
      })),
    });
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    const sessionId = readSessionCookie(request);
    if (sessionId) {
      await cache.del(`session:${sessionId}`);
    }
    clearSessionCookie(reply);
    return reply.send({ message: 'Logged out' });
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.currentUser?.id;
    if (!userId) {
      return reply.status(401).send({ message: ERRORS.unauthorizedAccess.message });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return reply.status(401).send({ message: 'User not found' });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions.map((rp) => rp.permission.name),
      })),
    });
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.currentUser?.id;
    if (!userId) {
      return reply.status(401).send({ message: 'Не авторизован' });
    }

    const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return reply.status(400).send({ message: 'Пользователь не найден' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return reply.status(400).send({ message: 'Неверный текущий пароль' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    return reply.send({ message: 'Пароль изменён' });
  } catch (err) {
    handleServerError(reply, err);
  }
}
