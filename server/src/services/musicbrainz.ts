import { fetch } from 'undici'
import PQueue from 'p-queue'
import { query } from '../db/client.js'
import { spotifyService } from './spotify.js'
import type { ArtistResult, JobSettings } from '../shared/types.js'

// MusicBrainz enforces 1 req/sec — p-queue handles throttling
const mbQueue = new PQueue({ interval: 1100, intervalCap: 1 })

const MB_BASE = 'https://musicbrainz.org/ws/2'
const MB_HEADERS = {
  'User-Agent': `${process.env.MUSICBRAINZ_APP_NAME}/${process.env.MUSICBRAINZ_APP_VERSION} (${process.env.MUSICBRAINZ_CONTACT_URL})`,
  'Accept': 'application/json',
}

async function mbFetch(path: string): Promise<any> {
  return mbQueue.add(async () => {
    const res = await fetch(`${MB_BASE}${path}`, { headers: MB_HEADERS })
    if (!res.ok) throw new Error(`MusicBrainz error: ${res.status} ${path}`)
    return res.json()
  })
}

async function getAreaMbid(cityName: string): Promise<string | null> {
  const data = await mbFetch(`/area?query=${encodeURIComponent(cityName)}&limit=1&fmt=json`)
  return data.areas?.[0]?.id ?? null
}

async function getArtistsByArea(areaMbid: string, limit = 25): Promise<any[]> {
  const data = await mbFetch(`/artist?area=${areaMbid}&limit=${limit}&fmt=json`)
  return data.artists ?? []
}

export const musicBrainzService = {
  async getArtistsForCity(cityName: string, settings: JobSettings): Promise<ArtistResult[]> {
    // Check cache first
    const cached = await query<{ artists: ArtistResult[] }>(
      'SELECT artists FROM artist_cache WHERE city_mbid = (SELECT id FROM artist_cache WHERE city_name = $1 LIMIT 1)',
      [cityName]
    )
    if (cached.length && cached[0].artists) {
      return filterAndLimitArtists(cached[0].artists, settings)
    }

    const mbid = await getAreaMbid(cityName)
    if (!mbid) return []

    const rawArtists = await getArtistsByArea(mbid)

    // Resolve each artist against Spotify
    const results: ArtistResult[] = []
    for (const artist of rawArtists) {
      const spotifyMatch = await spotifyService.searchArtist(artist.name)
      results.push({
        mbid: artist.id,
        name: artist.name,
        spotifyId: spotifyMatch?.id ?? null,
        spotifyUrl: spotifyMatch?.external_urls?.spotify ?? null,
        trackCount: 0,
      })
    }

    // Cache the full unfiltered result
    await query(
      `INSERT INTO artist_cache (city_mbid, city_name, artists)
       VALUES ($1, $2, $3)
       ON CONFLICT (city_mbid) DO UPDATE SET artists = EXCLUDED.artists, cached_at = NOW()`,
      [mbid, cityName, JSON.stringify(results)]
    )

    return filterAndLimitArtists(results, settings)
  }
}

function filterAndLimitArtists(artists: ArtistResult[], settings: JobSettings): ArtistResult[] {
  let filtered = artists.filter(a => a.spotifyId !== null)
  // Genre filtering would go here once we enrich artists with genre tags
  return filtered.slice(0, settings.maxArtistsPerCity)
}
