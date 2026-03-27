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
      return reply.redirect(`${process.env.CLIENT_URL ?? 'http://127.0.0.1:3000'}?error=spotify_denied`)
    }

    try {
      req.log.info('OAuth callback: exchanging code for tokens')
      const tokens = await spotifyService.exchangeCode(code)

      if (!tokens.access_token) {
        req.log.error({ tokens }, 'Spotify token exchange returned no access_token')
        return reply.redirect(`${process.env.CLIENT_URL ?? 'http://127.0.0.1:3000'}?error=spotify_token_failed`)
      }
      req.log.info('OAuth callback: token exchange OK, fetching profile')

      const profile = await spotifyService.getProfile(tokens.access_token)
      req.log.info({ spotifyId: profile.id, name: profile.display_name }, 'OAuth callback: profile fetched')

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
      req.log.info('OAuth callback: user upserted')

      const [user] = await query<{ id: string }>(
        'SELECT id FROM users WHERE spotify_id = $1', [profile.id]
      )
      req.log.info({ userId: user?.id }, 'OAuth callback: user row fetched')

      ;(req.session as any).userId = user.id
      await req.session.save()
      req.log.info({ sessionId: req.session.sessionId }, 'OAuth callback: session saved, redirecting to dashboard')
      return reply.redirect(`${process.env.CLIENT_URL ?? 'http://127.0.0.1:3000'}/dashboard`)

    } catch (err) {
      req.log.error(err, 'Spotify OAuth callback failed')
      return reply.redirect(`${process.env.CLIENT_URL ?? 'http://127.0.0.1:3000'}?error=spotify_auth_failed`)
    }
  })

  // Step 3: verify Spotify connection is still valid
  // Called by the dashboard on mount to catch revoked/expired tokens before a job starts
  fastify.get('/spotify/status', async (req, reply) => {
    const userId = (req.session as any).userId
    if (!userId) return reply.status(401).send({ error: 'Not authenticated' })

    const [user] = await query<{
      id: string
      access_token: string
      refresh_token: string
      token_expires_at: string
    }>(
      'SELECT id, access_token, refresh_token, token_expires_at FROM users WHERE id = $1',
      [userId]
    )
    if (!user) return reply.status(404).send({ error: 'User not found' })

    try {
      // getValidToken will attempt a refresh if the token is near expiry.
      // If the refresh token is also invalid (user revoked access in Spotify),
      // it throws — we catch that and return connected: false.
      await spotifyService.getValidToken(user)
      return { connected: true }
    } catch (err: any) {
      req.log.warn({ err: err.message }, 'Spotify token invalid — user needs to reconnect')
      return { connected: false, reason: err.message }
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
