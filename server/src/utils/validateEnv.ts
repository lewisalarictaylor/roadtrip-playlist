const REQUIRED = [
  'SESSION_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'GOOGLE_MAPS_API_KEY',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'MUSICBRAINZ_APP_NAME',
  'MUSICBRAINZ_CONTACT_URL',
] as const

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error('\n[startup] Missing required environment variables:')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('\nCopy .env.example to .env and fill in the missing values.\n')
    process.exit(1)
  }
}
