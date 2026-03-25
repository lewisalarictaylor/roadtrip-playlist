import type { FastifyPluginAsync } from 'fastify'
import { progressEmitter } from '../jobs/progress.js'

// Server-Sent Events endpoint — frontend connects here to get live job updates
export const sseRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { jobId: string } }>('/:jobId', (req, reply) => {
    const { jobId } = req.params

    reply.raw.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    })

    const send = (data: object) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const handler = (event: { jobId: string; [k: string]: unknown }) => {
      if (event.jobId === jobId) send(event)
    }

    progressEmitter.on('progress', handler)

    // Heartbeat every 15s to keep the connection alive
    const heartbeat = setInterval(() => reply.raw.write(': ping\n\n'), 15_000)

    req.raw.on('close', () => {
      progressEmitter.off('progress', handler)
      clearInterval(heartbeat)
    })
  })
}
