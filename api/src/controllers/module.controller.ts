import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import { handleServerError, ERRORS } from '../helpers/errors.helper';

export async function listModules(request: FastifyRequest, reply: FastifyReply) {
  try {
    const modules = await prisma.module.findMany({ orderBy: { order: 'asc' } });
    return reply.send(modules);
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function getModule(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const mod = await prisma.module.findUnique({ where: { id } });
    if (!mod) {
      return reply.status(404).send({ message: ERRORS.notFound.message });
    }
    return reply.send(mod);
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function createModule(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as {
      key: string;
      name: string;
      description?: string;
      icon: string;
      route: string;
      order?: number;
    };
    const mod = await prisma.module.create({ data });
    return reply.status(201).send(mod);
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function updateModule(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const data = request.body as Record<string, unknown>;
    const mod = await prisma.module.update({ where: { id }, data });
    return reply.send(mod);
  } catch (err) {
    handleServerError(reply, err);
  }
}

export async function deleteModule(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    await prisma.module.delete({ where: { id } });
    return reply.status(204).send();
  } catch (err) {
    handleServerError(reply, err);
  }
}
