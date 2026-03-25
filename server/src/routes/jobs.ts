import type { FastifyPluginAsync } from 'fastify'
import { query } from '../db/client.js'
import { playlistQueue } from '../jobs/queue.js'
import type { JobSettings } from '../../../shared/types.js'
import { DEFAULT_SETTINGS } from '../../../shared/types.js'

export const jobRoutes: FastifyPluginAsync = async (fastify) => {

  // Create a new playlist generation job
  fastify.post<{ Body: { origin: string; destination: string; settings?: Partial<JobSettings> } }>(
    '/',
    async (req, reply) => {
      const userId = (req.session as any).userId
      if (!userId) return reply.status(401).send({ error: 'Not authenticated' })

      const { origin, destination, settings } = req.body
      if (!origin || !destination) {
        return reply.status(400).send({ error: 'origin and destination are required' })
      }

      const mergedSettings: JobSettings = { ...DEFAULT_SETTINGS, ...settings }

      const [job] = await query<{ id: string }>(
        `INSERT INTO jobs (user_id, status, origin, destination, settings)
         VALUES ($1, 'pending', $2, $3, $4) RETURNING id`,
        [userId, origin, destination, JSON.stringify(mergedSettings)]
      )

      // Enqueue the background job
      await playlistQueue.add('generate', { jobId: job.id, userId })

      return reply.status(202).send({ jobId: job.id })
    }
  )

  // Get a single job's current state
  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const userId = (req.session as any).userId
    if (!userId) return reply.status(401).send({ error: 'Not authenticated' })

    const [job] = await query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    )
    if (!job) return reply.status(404).send({ error: 'Job not found' })

    const cities = await query(
      'SELECT * FROM job_cities WHERE job_id = $1 ORDER BY route_order',
      [req.params.id]
    )

    return { ...job, cities }
  })

  // List all jobs for the current user
  fastify.get('/', async (req, reply) => {
    const userId = (req.session as any).userId
    if (!userId) return reply.status(401).send({ error: 'Not authenticated' })

    return query(
      'SELECT id, status, origin, destination, created_at FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    )
  })
}
