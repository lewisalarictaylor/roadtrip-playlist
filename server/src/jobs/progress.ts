import { EventEmitter } from 'events'
import type { JobProgress } from '../../../shared/types.js'

// Single in-process emitter — swap for Redis pub/sub when scaling horizontally
export const progressEmitter = new EventEmitter()

export function emitProgress(event: JobProgress) {
  progressEmitter.emit('progress', event)
}
