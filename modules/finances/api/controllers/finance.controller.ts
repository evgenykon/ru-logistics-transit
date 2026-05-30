import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../../src/db'
import { handleServerError } from '../../../../src/helpers/errors.helper'

export async function listTransactions(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await prisma.transaction.findMany({ orderBy: { date: 'desc' } })
    return reply.send(data)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function createTransaction(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any
    const t = await prisma.transaction.create({ data })
    return reply.status(201).send(t)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function updateTransaction(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const t = await prisma.transaction.update({ where: { id }, data })
    return reply.send(t)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function deleteTransaction(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await prisma.transaction.delete({ where: { id } })
    return reply.send({ message: 'Транзакция удалена' })
  } catch (err) {
    handleServerError(reply, err)
  }
}
