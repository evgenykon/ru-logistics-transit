import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../src/middleware/require-auth'
import { listTrackPoints, createTrackPoint, getOrderTrack } from './controllers/tracking.controller'

export default async function (server: FastifyInstance) {
  server.get('', { preHandler: [requireAuth] }, listTrackPoints)
  server.post('', { preHandler: [requireAuth] }, createTrackPoint)
  server.get('/order/:orderId', { preHandler: [requireAuth] }, getOrderTrack)
}
