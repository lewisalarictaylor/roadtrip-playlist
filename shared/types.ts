// Job status progression
export type JobStatus =
  | 'pending'
  | 'routing'
  | 'geocoding'
  | 'artists'
  | 'spotify'
  | 'complete'
  | 'failed'

export interface JobSettings {
  samplingIntervalKm: number       // how often to sample the route (default 20)
  tracksPerArtist: number          // 1–5 (default 2)
  maxArtistsPerCity: number        // (default 3)
  minArtistPopularity: number      // MusicBrainz rating threshold 0–100 (default 20)
  genres: string[]                 // empty = no filter
  playlistOrder: 'route' | 'shuffle'
  fallbackToRegion: boolean        // expand to county if city has no artists
  playlistVisibility: 'public' | 'private'
}

export interface CityResult {
  name: string
  routeOrder: number
  mbid: string | null
  artists: ArtistResult[]
}

export interface ArtistResult {
  mbid: string
  name: string
  spotifyId: string | null
  spotifyUrl: string | null
  trackCount: number
}

export interface Job {
  id: string
  status: JobStatus
  origin: string
  destination: string
  settings: JobSettings
  cities: CityResult[]
  spotifyPlaylistId: string | null
  spotifyPlaylistUrl: string | null
  error: string | null
  createdAt: string
}

export interface JobProgress {
  jobId: string
  status: JobStatus
  message: string
  citiesFound?: number
  artistsFound?: number
  tracksAdded?: number
}

export { DEFAULT_SETTINGS } from './defaults.js'
