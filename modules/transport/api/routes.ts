import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../src/middleware/require-auth'
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from './controllers/vehicle.controller'

export default async function (server: FastifyInstance) {
  server.get('', { preHandler: [requireAuth] }, listVehicles)
  server.post('', { preHandler: [requireAuth] }, createVehicle)
  server.put('/:id', { preHandler: [requireAuth] }, updateVehicle)
  server.delete('/:id', { preHandler: [requireAuth] }, deleteVehicle)
}
