import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import { handleServerError } from '../helpers/errors.helper';

export async function listRoles(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return reply.send(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
        })),
      })),
    );
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function createRole(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, description, permissionIds } = request.body as {
      name: string;
      description?: string;
      permissionIds: string[];
    };

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    return reply.status(201).send({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    });
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function updateRole(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    if (id === 'role_admin') {
      return reply.status(403).send({ message: 'Нельзя редактировать системную роль admin' });
    }

    const { name, description, permissionIds } = request.body as {
      name: string;
      description?: string;
      permissionIds: string[];
    };

    await prisma.rolePermission.deleteMany({ where: { roleId: id } });

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    return reply.send({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    });
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function deleteRole(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    if (id === 'role_admin') {
      return reply.status(403).send({ message: 'Нельзя удалить системную роль admin' });
    }

    const userCount = await prisma.userRole.count({ where: { roleId: id } });
    if (userCount > 0) {
      return reply.status(400).send({
        message: `Невозможно удалить роль — она назначена ${userCount} пользователю(-ям)`,
      });
    }

    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });

    return reply.send({ message: 'Роль удалена' });
  } catch (err) {
    handleServerError(reply, err);
  }
}
