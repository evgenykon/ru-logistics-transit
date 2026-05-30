import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../../src/db'
import { handleServerError } from '../../../../src/helpers/errors.helper'

async function getModuleConfig() {
  const mod = await prisma.module.findUnique({ where: { key: 'orders' } })
  return ((mod?.config as any) || {}) as { orderPrefix?: string; numberingType?: string }
}

export async function listOrders(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const orders = await prisma.order.findMany({
      include: { cargos: true },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(orders)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function createOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any
    const cfg = await getModuleConfig()
    const prefix = cfg.orderPrefix || ''
    const seqPad = 6

    let counter: number
    if (cfg.numberingType === 'org' && data.organizationId) {
      const last = await prisma.order.findFirst({
        where: { organizationId: data.organizationId },
        orderBy: { createdAt: 'desc' },
      })
      counter = last ? parseSequence(last.number, prefix) + 1 : 1
    } else {
      const last = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } })
      counter = last ? parseSequence(last.number, prefix) + 1 : 1
    }

    const orderNumber = `${prefix}${String(counter).padStart(seqPad, '0')}`

    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        status: data.status || 'draft',
        description: data.description,
        organizationId: data.organizationId || null,
        createdById: request.currentUser?.id,
        cargos: data.cargos ? { create: data.cargos.map((c: any) => ({ name: c.name, weight: c.weight, volume: c.volume, quantity: c.quantity, unit: c.unit })) } : undefined,
      },
      include: { cargos: true },
    })
    return reply.status(201).send(order)
  } catch (err) {
    handleServerError(reply, err)
  }
}

function parseSequence(number: string, prefix: string): number {
  const num = prefix ? number.slice(prefix.length) : number
  return parseInt(num, 10) || 0
}

export async function updateOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const data = request.body as any

    const order = await prisma.order.update({
      where: { id },
      data: {
        number: data.number,
        status: data.status,
        description: data.description,
        organizationId: data.organizationId,
      },
      include: { cargos: true },
    })
    return reply.send(order)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function deleteOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await prisma.order.delete({ where: { id } })
    return reply.send({ message: 'Заказ удалён' })
  } catch (err) {
    handleServerError(reply, err)
  }
}
