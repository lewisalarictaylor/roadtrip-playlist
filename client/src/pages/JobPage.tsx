import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useJobStore } from '../store/job.ts'
import { ProgressView } from '../components/ProgressView.tsx'
import { ResultsView }  from '../components/ResultsView.tsx'

export function JobPage() {
  const { id } = useParams<{ id: string }>()
  const { currentJob, progress, watchJob, fetchJob } = useJobStore()

  useEffect(() => {
    if (!id) return
    fetchJob(id)
    const stop = watchJob(id)
    return stop
  }, [id])

  const status = currentJob?.status ?? progress?.status ?? 'pending'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
      <Link to="/dashboard" style={{ color: '#666', fontSize: 14 }}>← New trip</Link>

      <h2 style={{ marginTop: 24, fontSize: 22, fontWeight: 600 }}>
        {currentJob ? `${currentJob.origin} → ${currentJob.destination}` : 'Building your playlist...'}
      </h2>

      <div style={{ marginTop: 32 }}>
        {status === 'complete' && currentJob
          ? <ResultsView job={currentJob} />
          : <ProgressView status={status} progress={progress} />
        }
      </div>
    </div>
  )
}
