import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../../src/db'
import { handleServerError } from '../../../../src/helpers/errors.helper'

export async function listWarehouses(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { createdAt: 'desc' } })
    return reply.send(warehouses)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function createWarehouse(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any
    const warehouse = await prisma.warehouse.create({ data })
    return reply.status(201).send(warehouse)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function updateWarehouse(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const warehouse = await prisma.warehouse.update({ where: { id }, data })
    return reply.send(warehouse)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function deleteWarehouse(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await prisma.warehouse.delete({ where: { id } })
    return reply.send({ message: 'Склад удалён' })
  } catch (err) {
    handleServerError(reply, err)
  }
}
