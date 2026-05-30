import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../src/middleware/require-auth'
import { listOrders, createOrder, updateOrder, deleteOrder } from './controllers/order.controller'

export default async function (server: FastifyInstance) {
  server.get('', { preHandler: [requireAuth] }, listOrders)
  server.post('', { preHandler: [requireAuth] }, createOrder)
  server.put('/:id', { preHandler: [requireAuth] }, updateOrder)
  server.delete('/:id', { preHandler: [requireAuth] }, deleteOrder)
}
