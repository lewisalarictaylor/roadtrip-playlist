// Runtime defaults — kept separate from types.ts so they can be safely
// imported by Node ESM without tsx cross-package transpilation issues.
export const DEFAULT_SETTINGS = {
  samplingIntervalKm: 20,
  tracksPerArtist: 2,
  maxArtistsPerCity: 3,
  minArtistPopularity: 20,
  genres: [],
  playlistOrder: 'route',
  fallbackToRegion: true,
  playlistVisibility: 'private',
}
