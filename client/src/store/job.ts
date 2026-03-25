import { create } from 'zustand'
import type { Job, JobProgress, JobSettings } from '../../../shared/types.ts'
import { DEFAULT_SETTINGS } from '../../../shared/types.ts'

interface JobStore {
  currentJob: Job | null
  progress: JobProgress | null
  settings: JobSettings
  updateSettings: (s: Partial<JobSettings>) => void
  createJob: (origin: string, destination: string) => Promise<string>
  watchJob: (jobId: string) => () => void
  fetchJob: (jobId: string) => Promise<void>
}

export const useJobStore = create<JobStore>((set, get) => ({
  currentJob: null,
  progress: null,
  settings: DEFAULT_SETTINGS,

  updateSettings: (s) => set(st => ({ settings: { ...st.settings, ...s } })),

  async createJob(origin, destination) {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, settings: get().settings }),
    })
    const { jobId } = await res.json()
    return jobId
  },

  // Open an SSE connection and stream progress updates
  watchJob(jobId) {
    const es = new EventSource(`/api/progress/${jobId}`)
    es.onmessage = (e) => {
      const event: JobProgress = JSON.parse(e.data)
      set({ progress: event })
      if (event.status === 'complete' || event.status === 'failed') {
        es.close()
        get().fetchJob(jobId)
      }
    }
    return () => es.close()
  },

  async fetchJob(jobId) {
    const res = await fetch(`/api/jobs/${jobId}`, { credentials: 'include' })
    if (res.ok) set({ currentJob: await res.json() })
  },
}))
