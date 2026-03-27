import { fetch } from 'undici'
import PQueue from 'p-queue'
import { query } from '../db/client.js'
import { spotifyService } from './spotify.js'
import type { ArtistResult, JobSettings } from '../../../shared/types.js'

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
  // inc=tags fetches genre/style tags alongside each artist
  const data = await mbFetch(`/artist?area=${areaMbid}&limit=${limit}&fmt=json&inc=tags`)
  return data.artists ?? []
}

// Extract and normalise MusicBrainz tags to lowercase genre strings
function extractGenres(artist: any): string[] {
  if (!Array.isArray(artist.tags)) return []
  return artist.tags
    .filter((t: any) => t.count > 0)
    .map((t: any) => t.name.toLowerCase().trim())
}

export const musicBrainzService = {
  // spotifySearchCache is passed in per-job so the same artist name is only
  // looked up once even if they appear near multiple cities on the route
  async getArtistsForCity(
    cityName: string,
    settings: JobSettings,
    spotifySearchCache: Map<string, any>
  ): Promise<ArtistResult[]> {

    // Check DB cache first — returns full unfiltered artist list for this city
    const cached = await query<{ artists: ArtistResult[] }>(
      'SELECT artists FROM artist_cache WHERE city_name = $1 LIMIT 1',
      [cityName]
    )
    if (cached.length && cached[0].artists) {
      return filterAndLimitArtists(cached[0].artists, settings)
    }

    const mbid = await getAreaMbid(cityName)
    if (!mbid) return []

    const rawArtists = await getArtistsByArea(mbid)

    // Resolve each artist against Spotify, using the per-job cache to avoid
    // duplicate API calls for artists that appear near multiple cities
    const results: ArtistResult[] = []
    for (const artist of rawArtists) {
      let spotifyMatch: any

      if (spotifySearchCache.has(artist.name)) {
        spotifyMatch = spotifySearchCache.get(artist.name)
      } else {
        spotifyMatch = await spotifyService.searchArtist(artist.name)
        spotifySearchCache.set(artist.name, spotifyMatch)
      }

      results.push({
        mbid:      artist.id,
        name:      artist.name,
        genres:    extractGenres(artist),
        spotifyId: spotifyMatch?.id ?? null,
        spotifyUrl: spotifyMatch?.external_urls?.spotify ?? null,
        trackCount: 0,
      })
    }

    // Cache the full unfiltered result against the city MBID
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

  // Genre filter — if the user has specified genres, only include artists
  // who have at least one matching tag. Comparison is case-insensitive.
  if (settings.genres.length > 0) {
    const wanted = settings.genres.map(g => g.toLowerCase().trim())
    filtered = filtered.filter(a =>
      a.genres.some(g => wanted.some(w => g.includes(w) || w.includes(g)))
    )
  }

  return filtered.slice(0, settings.maxArtistsPerCity)
}
