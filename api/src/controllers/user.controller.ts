import type { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { handleServerError, ERRORS } from '../helpers/errors.helper';

export async function listUsers(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
      include: {
        roles: {
          include: { role: true },
        },
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        active: u.active,
        organizationId: u.organizationId,
        organization: u.organization ? { id: u.organization.id, name: u.organization.name } : null,
        roles: u.roles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
        })),
      })),
    );
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, name, phone, password, roleIds, organizationId } = request.body as {
      email: string;
      name?: string;
      phone?: string;
      password?: string;
      roleIds: string[];
      organizationId?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ message: 'Пользователь с таким логином уже существует' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: passwordHash,
        organizationId: organizationId || null,
        roles: roleIds.length
          ? { create: roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: {
        roles: { include: { role: true } },
        organization: true,
      },
    });

    return reply.status(201).send({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      organizationId: user.organizationId,
      organization: user.organization ? { id: user.organization.id, name: user.organization.name } : null,
      roles: user.roles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
    });
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function updateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    if (PROTECTED_USERS.has(id)) {
      return reply.status(403).send({ message: 'Нельзя редактировать системного пользователя' });
    }

    const { email, name, phone, password, roleIds, organizationId } = request.body as {
      email: string;
      name?: string;
      phone?: string;
      password?: string;
      roleIds: string[];
      organizationId?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== id) {
      return reply.status(409).send({ message: 'Пользователь с таким логином уже существует' });
    }

    const data: any = { email, name, phone, organizationId: organizationId || null };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    await prisma.userRole.deleteMany({ where: { userId: id } });

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        roles: roleIds.length
          ? { create: roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: {
        roles: { include: { role: true } },
        organization: true,
      },
    });

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      organizationId: user.organizationId,
      organization: user.organization ? { id: user.organization.id, name: user.organization.name } : null,
      roles: user.roles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
    });
  } catch (err) {
    handleServerError(reply, err);
  }
}

const PROTECTED_USERS = new Set(['user_admin']);

export async function updateUserRoles(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    if (PROTECTED_USERS.has(id)) {
      return reply.status(403).send({ message: 'Нельзя редактировать доступы системного пользователя' });
    }

    const { roleIds } = request.body as { roleIds: string[] };

    await prisma.userRole.deleteMany({ where: { userId: id } });

    if (roleIds.length) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: id, roleId })),
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return reply.send({
      id: user!.id,
      email: user!.email,
      name: user!.name,
      phone: user!.phone,
      roles: user!.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    });
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    if (PROTECTED_USERS.has(id)) {
      return reply.status(403).send({ message: 'Нельзя удалить системного пользователя' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        active: false,
        email: `${id}--deleted`,
      },
    });

    return reply.send({ message: 'Пользователь удалён' });
  } catch (err) {
    handleServerError(reply, err);
  }
}
