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

// Optional vars — the server has sensible fallbacks but warns if not set
const OPTIONAL: { key: string; fallback: string }[] = [
  { key: 'CLIENT_URL', fallback: 'http://127.0.0.1:3000' },
]

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error('\n[startup] Missing required environment variables:')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('\nCopy .env.example to .env and fill in the missing values.\n')
    process.exit(1)
  }

  OPTIONAL.forEach(({ key, fallback }) => {
    if (!process.env[key]) {
      console.warn(`[startup] ${key} not set — using fallback: ${fallback}`)
    }
  })
}