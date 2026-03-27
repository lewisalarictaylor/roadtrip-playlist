import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { query } from '../db/client.js'
import { playlistQueue } from '../jobs/queue.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { DEFAULT_SETTINGS } from '../../../shared/defaults.js'

const createJobSchema = z.object({
  origin:      z.string().min(2).max(200),
  destination: z.string().min(2).max(200),
  settings: z.object({
    samplingIntervalKm:   z.number().int().min(5).max(100).optional(),
    tracksPerArtist:      z.number().int().min(1).max(5).optional(),
    maxArtistsPerCity:    z.number().int().min(1).max(10).optional(),
    minArtistPopularity:  z.number().int().min(0).max(100).optional(),
    genres:               z.array(z.string()).optional(),
    playlistOrder:        z.enum(['route', 'shuffle']).optional(),
    fallbackToRegion:     z.boolean().optional(),
    playlistVisibility:   z.enum(['public', 'private']).optional(),
  }).optional(),
})

export const jobRoutes: FastifyPluginAsync = async (fastify) => {

  // All job routes require authentication
  fastify.addHook('preHandler', requireAuth)

  // Create a new playlist generation job
  fastify.post('/', async (req, reply) => {
    const parsed = createJobSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Bad request',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
      })
    }

    const { origin, destination, settings } = parsed.data
    const userId = (req.session as any).userId
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }

    const [job] = await query<{ id: string }>(
      `INSERT INTO jobs (user_id, status, origin, destination, settings)
       VALUES ($1, 'pending', $2, $3, $4) RETURNING id`,
      [userId, origin, destination, JSON.stringify(mergedSettings)]
    )

    await playlistQueue.add('generate', { jobId: job.id, userId })

    return reply.status(202).send({ jobId: job.id })
  })

  // Get a single job's current state
  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const userId = (req.session as any).userId

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
  fastify.get('/', async (req) => {
    const userId = (req.session as any).userId
    return query(
      `SELECT id, status, origin, destination, created_at
       FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    )
  })
}
