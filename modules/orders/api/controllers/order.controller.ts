import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../../src/db'
import { handleServerError } from '../../../../src/helpers/errors.helper'
import { Prisma } from '@prisma/client'

async function getModuleConfig() {
  const mod = await prisma.module.findUnique({ where: { key: 'orders' } })
  return ((mod?.config as any) || {}) as { orderPrefix?: string; numberingType?: string }
}

async function addEvent(orderId: string, type: string, description: string, userId?: string, metadata?: any) {
  await prisma.orderEvent.create({
    data: { orderId, type, description, userId: userId || null, metadata: metadata || Prisma.DbNull },
  })
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

export async function getOrderEvents(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const events = await prisma.orderEvent.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(events)
  } catch (err) {
    handleServerError(reply, err)
  }
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активен',
  completed: 'Завершён',
  cancelled: 'Отменён',
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
    const userId = request.currentUser?.id

    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        status: data.status || 'draft',
        description: data.description,
        organizationId: data.organizationId || null,
        createdById: userId,
        vehicleId: data.vehicleId || null,
        counterpartyId: data.counterpartyId || null,
        warehouseId: data.warehouseId || null,
        cargos: data.cargos ? { create: data.cargos.map((c: any) => ({ name: c.name, weight: c.weight, volume: c.volume, quantity: c.quantity, unit: c.unit })) } : undefined,
      },
      include: { cargos: true },
    })

    await addEvent(order.id, 'created', `Заказ ${orderNumber} создан`, userId, { status: order.status })
    if (data.cargos?.length) {
      await addEvent(order.id, 'cargos', `Добавлено грузов: ${data.cargos.length}`, userId, { count: data.cargos.length })
    }

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
    const userId = request.currentUser?.id

    const old = await prisma.order.findUnique({ where: { id }, include: { cargos: true } })
    if (!old) return reply.status(404).send({ message: 'Заказ не найден' })

    if (data.cargos) {
      const oldMap = new Map(old.cargos.map((c: any) => [c.name, c]))
      const newMap = new Map(data.cargos.map((c: any) => [c.name, c]))

      for (const [name, nc] of newMap) {
        const oc = oldMap.get(name)
        if (!oc) {
          await addEvent(id, 'cargos', `Добавлен груз: ${name} (${nc.quantity} ${nc.unit})`, userId)
        } else {
          const changed: string[] = []
          if (oc.weight !== nc.weight) changed.push(`вес: ${oc.weight ?? '—'} → ${nc.weight ?? '—'}`)
          if (oc.volume !== nc.volume) changed.push(`объём: ${oc.volume ?? '—'} → ${nc.volume ?? '—'}`)
          if (oc.quantity !== nc.quantity) changed.push(`кол-во: ${oc.quantity} → ${nc.quantity}`)
          if (oc.unit !== nc.unit) changed.push(`ед.: ${oc.unit} → ${nc.unit}`)
          if (changed.length) {
            await addEvent(id, 'cargos', `Изменён груз ${name}: ${changed.join(', ')}`, userId)
          }
        }
      }
      for (const [name] of oldMap) {
        if (!newMap.has(name)) {
          await addEvent(id, 'cargos', `Удалён груз: ${name}`, userId)
        }
      }

      await prisma.cargo.deleteMany({ where: { orderId: id } })
      await prisma.cargo.createMany({
        data: data.cargos.map((c: any) => ({
          name: c.name,
          weight: c.weight || null,
          volume: c.volume || null,
          quantity: c.quantity || 1,
          unit: c.unit || 'шт',
          orderId: id,
        })),
      })
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        number: data.number,
        status: data.status,
        description: data.description,
        organizationId: data.organizationId,
        vehicleId: data.vehicleId || null,
        counterpartyId: data.counterpartyId || null,
        warehouseId: data.warehouseId || null,
      },
      include: { cargos: true },
    })

    if (old.status !== order.status) {
      await addEvent(id, 'status', `Статус изменён: ${statusLabels[old.status] || old.status} → ${statusLabels[order.status] || order.status}`, userId, { from: old.status, to: order.status })
    }

    if (old.description !== order.description) {
      await addEvent(id, 'description', 'Описание изменено', userId)
    }

    if (old.organizationId !== order.organizationId) {
      let orgName = ''
      try {
        const org = await prisma.organization.findUnique({ where: { id: order.organizationId! } })
        if (org) orgName = org.name
      } catch {}
      await addEvent(id, 'organization', order.organizationId
        ? `Установлена организация: ${orgName}`
        : 'Организация откреплена', userId)
    }

    if (old.vehicleId !== order.vehicleId) {
      let vehicleName = order.vehicleId
      try {
        const v = await prisma.vehicle.findUnique({ where: { id: order.vehicleId! } })
        if (v) vehicleName = v.licensePlate
      } catch {}
      await addEvent(id, 'vehicle', order.vehicleId
        ? `Назначено ТС: ${vehicleName}`
        : 'ТС откреплено', userId)
    }

    if (old.counterpartyId !== order.counterpartyId) {
      let cpName = ''
      try {
        const cp = await prisma.counterparty.findUnique({ where: { id: order.counterpartyId! } })
        if (cp) cpName = cp.name
      } catch {}
      await addEvent(id, 'counterparty', order.counterpartyId
        ? `Установлен контрагент: ${cpName}`
        : 'Контрагент откреплён', userId)
    }

    if (old.warehouseId !== order.warehouseId) {
      let whName = ''
      try {
        const wh = await prisma.warehouse.findUnique({ where: { id: order.warehouseId! } })
        if (wh) whName = wh.name
      } catch {}
      await addEvent(id, 'warehouse', order.warehouseId
        ? `Установлен склад: ${whName}`
        : 'Склад откреплён', userId)
    }

    return reply.send(order)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function deleteOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await prisma.orderEvent.deleteMany({ where: { orderId: id } })
    await prisma.cargo.deleteMany({ where: { orderId: id } })
    await prisma.order.delete({ where: { id } })
    return reply.send({ message: 'Заказ удалён' })
  } catch (err) {
    handleServerError(reply, err)
  }
}
