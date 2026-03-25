import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { runPlaylistJob } from './playlistWorker.js'

const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

export const playlistQueue = new Queue('playlist', { connection })

// Worker: one at a time to respect MusicBrainz rate limit
new Worker(
  'playlist',
  async (job) => { await runPlaylistJob(job.data.jobId, job.data.userId) },
  { connection, concurrency: 1 }
)
