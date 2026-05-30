import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../src/middleware/require-auth'
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from './controllers/finance.controller'

export default async function (server: FastifyInstance) {
  server.get('', { preHandler: [requireAuth] }, listTransactions)
  server.post('', { preHandler: [requireAuth] }, createTransaction)
  server.put('/:id', { preHandler: [requireAuth] }, updateTransaction)
  server.delete('/:id', { preHandler: [requireAuth] }, deleteTransaction)
}
