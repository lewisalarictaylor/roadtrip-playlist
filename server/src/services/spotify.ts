import { fetch } from 'undici'
import { query } from '../db/client.js'

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!
const REDIRECT_URI  = process.env.SPOTIFY_REDIRECT_URI!
const SCOPES        = 'playlist-modify-public playlist-modify-private user-read-private'

type TokenRow = {
  id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
}

// App-level token for unauthenticated searches (Client Credentials flow)
let appToken: string | null = null
let appTokenExpiry = 0

async function getAppToken(): Promise<string> {
  if (appToken && Date.now() < appTokenExpiry - 60_000) return appToken
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json() as any
  appToken = data.access_token
  appTokenExpiry = Date.now() + data.expires_in * 1000
  return appToken!
}

export const spotifyService = {
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      response_type: 'code',
      redirect_uri:  REDIRECT_URI,
      scope:         SCOPES,
    })
    return `https://accounts.spotify.com/authorize?${params}`
  },

  async exchangeCode(code: string) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }),
    })
    return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>
  },

  async refreshToken(refreshToken: string) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })
    const data = await res.json() as any
    if (!data.access_token) {
      throw new Error(`Spotify token refresh failed (${data.error ?? 'unknown error'}). Please disconnect and reconnect your Spotify account.`)
    }
    return data as { access_token: string; expires_in: number }
  },

  // Get a valid user token, refreshing and persisting to DB if expired
  async getValidToken(user: TokenRow): Promise<string> {
    if (new Date(user.token_expires_at) > new Date(Date.now() + 60_000)) {
      return user.access_token
    }

    const { access_token, expires_in } = await this.refreshToken(user.refresh_token)

    // Persist the new token so subsequent jobs don't need to refresh again
    await query(
      `UPDATE users
       SET access_token = $1, token_expires_at = NOW() + $2 * INTERVAL '1 second'
       WHERE id = $3`,
      [access_token, expires_in, user.id]
    )

    return access_token
  },

  async getProfile(token: string) {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json() as Promise<{ id: string; display_name: string }>
  },

  async searchArtist(name: string): Promise<any | null> {
    const token = await getAppToken()
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(name)}&type=artist&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json() as any
    const candidates: any[] = data.artists?.items ?? []

    // Validate the match — Spotify's search is fuzzy and will return a result
    // even when the name is ambiguous or only loosely related. We normalise
    // both names and require a close match before accepting the result,
    // to avoid adding tracks from a completely different artist.
    const normalise = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()

    // Strip a leading "the " for comparison purposes — MusicBrainz and Spotify
    // often differ on whether an act is listed as "The X" or just "X"
    const stripThe = (s: string) => s.replace(/^the /, '')

    const normQuery = normalise(name)
    const normQueryNoThe = stripThe(normQuery)

    for (const candidate of candidates) {
      const normResult = normalise(candidate.name)
      const normResultNoThe = stripThe(normResult)

      // Exact match with or without leading "the"
      if (normResult === normQuery || normResultNoThe === normQueryNoThe) {
        return candidate
      }

      // Substring match — only accept if names are close in length.
      // Without the ratio check, "Frog" matches "Crazy Frog", "HEX" matches
      // "HEXXENMIND", "Apostles" matches "Queen of Apostles" etc.
      const longer  = Math.max(normResultNoThe.length, normQueryNoThe.length)
      const shorter = Math.min(normResultNoThe.length, normQueryNoThe.length)
      const ratio   = shorter / longer

      if (ratio >= 0.6 &&
          (normResultNoThe.includes(normQueryNoThe) ||
           normQueryNoThe.includes(normResultNoThe))) {
        return candidate
      }
    }

    return null
  },

  async getTopTrackUris(token: string, artistId: string, limit: number): Promise<string[]> {
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=GB`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json() as any
    return (data.tracks ?? []).slice(0, limit).map((t: any) => t.uri)
  },

  async createPlaylist(token: string, userId: string, name: string, description: string, isPublic: boolean) {
    const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, public: isPublic }),
    })
    return res.json() as Promise<{ id: string; external_urls: { spotify: string } }>
  },

  async addTracks(token: string, playlistId: string, uris: string[]) {
    for (let i = 0; i < uris.length; i += 100) {
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: uris.slice(i, i + 100) }),
      })
    }
  },
}