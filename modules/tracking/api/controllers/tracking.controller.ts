import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../../src/db'
import { handleServerError } from '../../../../src/helpers/errors.helper'

export async function listTrackPoints(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const points = await prisma.trackPoint.findMany({ orderBy: { recordedAt: 'desc' }, take: 100 })
    return reply.send(points)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function createTrackPoint(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any
    const point = await prisma.trackPoint.create({ data })

    if (data.orderId) {
      try {
        await (prisma as any).orderEvent.create({
          data: {
            orderId: data.orderId,
            type: 'tracking',
            description: `Добавлена точка трекинга: ${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)}`,
            userId: request.currentUser?.id || null,
          },
        })
      } catch {}
    }

    return reply.status(201).send(point)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function getOrderTrack(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderId } = request.params as { orderId: string }
    const points = await prisma.trackPoint.findMany({
      where: { orderId },
      orderBy: { recordedAt: 'asc' },
    })
    return reply.send(points)
  } catch (err) {
    handleServerError(reply, err)
  }
}
