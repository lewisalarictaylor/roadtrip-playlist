import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import session from '@fastify/session'
import { authRoutes } from './routes/auth.js'
import { jobRoutes } from './routes/jobs.js'
import { sseRoutes } from './routes/sse.js'

const server = Fastify({ logger: { level: 'info' } })

await server.register(cors, {
  origin: 'http://localhost:3000',
  credentials: true,
})

await server.register(cookie)
await server.register(session, {
  secret: process.env.SESSION_SECRET!,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
})

await server.register(authRoutes, { prefix: '/api/auth' })
await server.register(jobRoutes,  { prefix: '/api/jobs' })
await server.register(sseRoutes,  { prefix: '/api/progress' })

server.get('/api/health', async () => ({ status: 'ok' }))

try {
  await server.listen({ port: Number(process.env.PORT ?? 4000), host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
