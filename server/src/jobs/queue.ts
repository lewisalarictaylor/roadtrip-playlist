import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { runPlaylistJob } from './playlistWorker.js'
import { runCacheCleanup } from './cacheCleanupWorker.js'

const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

export const playlistQueue = new Queue('playlist', { connection })

// Worker: one at a time to respect MusicBrainz rate limit
new Worker(
  'playlist',
  async (job) => {
    if (job.name === 'generate') {
      await runPlaylistJob(job.data.jobId, job.data.userId)
    }
    if (job.name === 'cache-cleanup') {
      await runCacheCleanup()
    }
  },
  { connection, concurrency: 1 }
)

// Schedule the cache cleanup to run once a day.
// BullMQ persists repeatable jobs in Redis so this survives server restarts —
// the job is only added if it isn't already scheduled.
await playlistQueue.add(
  'cache-cleanup',
  {},
  {
    repeat: { pattern: '0 3 * * *' },  // 3am daily
    jobId: 'cache-cleanup-recurring',  // stable ID prevents duplicates on restart
  }
)

console.info('[queue] Cache cleanup scheduled — runs daily at 03:00')
