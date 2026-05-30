import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../../src/db'
import { handleServerError } from '../../../../src/helpers/errors.helper'

export async function listVehicles(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } })
    return reply.send(vehicles)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function createVehicle(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any

    const existing = await prisma.vehicle.findUnique({ where: { licensePlate: data.licensePlate } })
    if (existing) {
      return reply.status(409).send({ message: 'ТС с таким госномером уже существует' })
    }

    const vehicle = await prisma.vehicle.create({ data })
    return reply.status(201).send(vehicle)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function updateVehicle(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const vehicle = await prisma.vehicle.update({ where: { id }, data })
    return reply.send(vehicle)
  } catch (err) {
    handleServerError(reply, err)
  }
}

export async function deleteVehicle(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await prisma.vehicle.delete({ where: { id } })
    return reply.send({ message: 'ТС удалено' })
  } catch (err) {
    handleServerError(reply, err)
  }
}
