import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error)

  // Zod validation errors come through as statusCode 400
  if (error.statusCode === 400) {
    return reply.status(400).send({
      error: 'Bad request',
      message: error.message,
    })
  }

  // Known HTTP errors (401, 403, 404) — pass through as-is
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      error: error.message,
    })
  }

  // Everything else is a 500 — don't leak internals in production
  return reply.status(500).send({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  })
}
