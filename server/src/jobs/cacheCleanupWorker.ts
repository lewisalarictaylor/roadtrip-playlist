import { query } from '../db/client.js'

const CACHE_TTL_DAYS = 30

export async function runCacheCleanup() {
  const result = await query<{ count: string }>(
    `DELETE FROM artist_cache
     WHERE cached_at < NOW() - INTERVAL '${CACHE_TTL_DAYS} days'
     RETURNING city_mbid`
  )

  const deleted = result.length
  if (deleted > 0) {
    console.info(`[cache-cleanup] Deleted ${deleted} stale artist cache entries (older than ${CACHE_TTL_DAYS} days)`)
  } else {
    console.info(`[cache-cleanup] No stale entries found`)
  }

  return deleted
}
