import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../src/middleware/require-auth'
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from './controllers/warehouse.controller'

export default async function (server: FastifyInstance) {
  server.get('', { preHandler: [requireAuth] }, listWarehouses)
  server.post('', { preHandler: [requireAuth] }, createWarehouse)
  server.put('/:id', { preHandler: [requireAuth] }, updateWarehouse)
  server.delete('/:id', { preHandler: [requireAuth] }, deleteWarehouse)
}
