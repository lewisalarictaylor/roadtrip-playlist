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

async function getArtistsByArea(areaMbid: string, limit = 100): Promise<any[]> {
  // Fetch a large pool — MusicBrainz returns alphabetically, so a small limit
  // would systematically favour artists starting with A-E over well-known acts
  // further down the alphabet. We pre-score and trim before hitting Spotify.
  const data = await mbFetch(`/artist?area=${areaMbid}&limit=${limit}&fmt=json&inc=tags`)
  return data.artists ?? []
}

// Score an artist using only MusicBrainz data, before any Spotify calls.
// Higher = more likely to be a well-known act worth resolving.
// This lets us trim the candidate pool cheaply before the expensive Spotify step.
function mbScore(artist: any): number {
  let score = 0

  // MusicBrainz attaches a relevance score to search results (0-100)
  if (typeof artist.score === 'number') score += artist.score

  // Total tag votes across all tags — more votes = more community attention
  if (Array.isArray(artist.tags)) {
    const tagTotal = artist.tags.reduce((n: number, t: any) => n + (t.count ?? 0), 0)
    // Cap contribution so one massively-tagged artist doesn't dominate
    score += Math.min(tagTotal, 50)
  }

  return score
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

    // Pre-score and trim using only MusicBrainz data — this avoids making
    // Spotify calls for artists with no community signal at all.
    // We take the top 30 by MusicBrainz score as the candidate pool,
    // which keeps Spotify calls close to the original 25 while covering
    // the full alphabet rather than just A-E.
    const SPOTIFY_CANDIDATE_LIMIT = 30
    const candidates = rawArtists
      .map(a => ({ artist: a, score: mbScore(a) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, SPOTIFY_CANDIDATE_LIMIT)
      .map(c => c.artist)

    // Resolve each candidate against Spotify, capturing the popularity score.
    const results: ArtistResult[] = []
    for (const artist of candidates) {
      let spotifyMatch: any

      if (spotifySearchCache.has(artist.name)) {
        spotifyMatch = spotifySearchCache.get(artist.name)
      } else {
        spotifyMatch = await spotifyService.searchArtist(artist.name)
        spotifySearchCache.set(artist.name, spotifyMatch)
      }

      results.push({
        mbid:       artist.id,
        name:       artist.name,
        genres:     extractGenres(artist),
        spotifyId:  spotifyMatch?.id ?? null,
        spotifyUrl: spotifyMatch?.external_urls?.spotify ?? null,
        // Spotify popularity is 0-100 based on recent stream counts.
        // Stored so we can sort by it when selecting artists per city.
        trackCount: spotifyMatch?.popularity ?? 0,
      })
    }

    // Cache the full unfiltered, unsorted result
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

  // Sort by Spotify popularity descending so the most-streamed artists
  // from each city rise to the top, rather than whoever comes first alphabetically
  filtered.sort((a, b) => b.trackCount - a.trackCount)

  return filtered.slice(0, settings.maxArtistsPerCity)
}