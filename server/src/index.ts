import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import session from '@fastify/session'
import RedisStore from 'connect-redis'
import IORedis from 'ioredis'
import { authRoutes } from './routes/auth.js'
import { jobRoutes } from './routes/jobs.js'
import { sseRoutes } from './routes/sse.js'
import { previewRoutes } from './routes/preview.js'
import { errorHandler } from './middleware/errorHandler.js'
import { validateEnv } from './utils/validateEnv.js'
import './jobs/queue.js'  // import side-effect: starts the BullMQ worker

validateEnv()

const server = Fastify({ logger: { level: 'info' } })

server.setErrorHandler(errorHandler)

await server.register(cors, {
  origin: process.env.CLIENT_URL ?? 'http://127.0.0.1:3000',
  credentials: true,
})

await server.register(cookie)

// Use Redis to store sessions so they survive server restarts
const redisClient = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
const sessionStore = new RedisStore({ client: redisClient, prefix: 'sess:' })

await server.register(session, {
  secret: process.env.SESSION_SECRET!,
  store: sessionStore,
  cookie: {
    secure: false, // must be false when not using HTTPS in development
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
})

await server.register(authRoutes,    { prefix: '/api/auth' })
await server.register(jobRoutes,     { prefix: '/api/jobs' })
await server.register(sseRoutes,     { prefix: '/api/progress' })
await server.register(previewRoutes, { prefix: '/api/preview' })

server.get('/api/health', async () => ({ status: 'ok' }))

try {
  await server.listen({ port: Number(process.env.PORT ?? 4000), host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
