import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../src/middleware/require-auth'
import { listCounterparties, createCounterparty, updateCounterparty, deleteCounterparty } from './controllers/counterparty.controller'

export default async function (server: FastifyInstance) {
  server.get('', { preHandler: [requireAuth] }, listCounterparties)
  server.post('', { preHandler: [requireAuth] }, createCounterparty)
  server.put('/:id', { preHandler: [requireAuth] }, updateCounterparty)
  server.delete('/:id', { preHandler: [requireAuth] }, deleteCounterparty)
}
