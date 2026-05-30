import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import { handleServerError } from '../helpers/errors.helper';

export async function listOrganizations(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const orgs = await prisma.organization.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return reply.send(orgs);
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function createOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;

    const existing = await prisma.organization.findUnique({ where: { inn: data.inn } });
    if (existing) {
      return reply.status(409).send({ message: 'Организация с таким ИНН уже существует' });
    }

    const org = await prisma.organization.create({ data });
    return reply.status(201).send(org);
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function updateOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const org = await prisma.organization.update({ where: { id }, data });
    return reply.send(org);
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function deleteOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    const userCount = await prisma.user.count({ where: { organizationId: id, active: true } });
    if (userCount > 0) {
      return reply.status(400).send({
        message: `Невозможно удалить организацию — к ней привязано ${userCount} пользователей`,
      });
    }

    await prisma.organization.update({
      where: { id },
      data: { active: false },
    });
    return reply.send({ message: 'Организация удалена' });
  } catch (err) {
    handleServerError(reply, err);
  }
}
