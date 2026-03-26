import type { FastifyReply, FastifyRequest } from 'fastify'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.session as any).userId
  if (!userId) {
    return reply.status(401).send({ error: 'Not authenticated' })
  }
}
