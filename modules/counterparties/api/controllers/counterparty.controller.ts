import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../../src/db'
import { handleServerError } from '../../../../src/helpers/errors.helper'

export async function listCounterparties(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await prisma.counterparty.findMany({ orderBy: { createdAt: 'desc' } })
    return reply.send(data)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function createCounterparty(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any
    const existing = await prisma.counterparty.findUnique({ where: { inn: data.inn } })
    if (existing) {
      return reply.status(409).send({ message: 'Контрагент с таким ИНН уже существует' })
    }
    const cp = await prisma.counterparty.create({ data })
    return reply.status(201).send(cp)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function updateCounterparty(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const cp = await prisma.counterparty.update({ where: { id }, data })
    return reply.send(cp)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function deleteCounterparty(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await prisma.counterparty.delete({ where: { id } })
    return reply.send({ message: 'Контрагент удалён' })
  } catch (err) {
    handleServerError(reply, err)
  }
}
