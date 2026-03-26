import type { FastifyPluginAsync } from 'fastify'
import { spotifyService } from '../services/spotify.js'
import { query } from '../db/client.js'

export const authRoutes: FastifyPluginAsync = async (fastify) => {

  // Step 1: redirect user to Spotify login
  fastify.get('/spotify', async (req, reply) => {
    const url = spotifyService.getAuthUrl()
    return reply.redirect(url)
  })

  // Step 2: Spotify redirects back here with ?code=...
  fastify.get('/spotify/callback', async (req, reply) => {
    const { code, error } = req.query as { code?: string; error?: string }

    if (error || !code) {
      return reply.redirect('http://localhost:3000?error=spotify_denied')
    }

    try {
      const tokens = await spotifyService.exchangeCode(code)

      if (!tokens.access_token) {
        req.log.error({ tokens }, 'Spotify token exchange returned no access_token')
        return reply.redirect('http://localhost:3000?error=spotify_token_failed')
      }

      const profile = await spotifyService.getProfile(tokens.access_token)

      // Upsert user
      await query(
        `INSERT INTO users (spotify_id, display_name, access_token, refresh_token, token_expires_at)
         VALUES ($1, $2, $3, $4, NOW() + $5 * INTERVAL '1 second')
         ON CONFLICT (spotify_id) DO UPDATE SET
           display_name     = EXCLUDED.display_name,
           access_token     = EXCLUDED.access_token,
           refresh_token    = EXCLUDED.refresh_token,
           token_expires_at = EXCLUDED.token_expires_at`,
        [profile.id, profile.display_name, tokens.access_token, tokens.refresh_token, tokens.expires_in]
      )

      const [user] = await query<{ id: string }>(
        'SELECT id FROM users WHERE spotify_id = $1', [profile.id]
      )

      ;(req.session as any).userId = user.id
      await req.session.save()
      return reply.redirect('http://localhost:3000/dashboard')

    } catch (err) {
      req.log.error(err, 'Spotify OAuth callback failed')
      return reply.redirect('http://localhost:3000?error=spotify_auth_failed')
    }
  })

  fastify.get('/me', async (req, reply) => {
    const userId = (req.session as any).userId
    if (!userId) return reply.status(401).send({ error: 'Not authenticated' })
    const [user] = await query<{ id: string; display_name: string }>(
      'SELECT id, display_name FROM users WHERE id = $1', [userId]
    )
    return user ?? reply.status(404).send({ error: 'User not found' })
  })

  fastify.post('/logout', async (req, reply) => {
    await req.session.destroy()
    return reply.send({ ok: true })
  })
}
