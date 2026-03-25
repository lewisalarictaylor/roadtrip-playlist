import type { JobProgress, JobStatus } from '../../../shared/types.ts'

const STEPS: { key: JobStatus; label: string }[] = [
  { key: 'routing',   label: 'Getting route' },
  { key: 'geocoding', label: 'Finding cities' },
  { key: 'artists',   label: 'Looking up artists' },
  { key: 'spotify',   label: 'Building playlist' },
  { key: 'complete',  label: 'Done' },
]

const ORDER: JobStatus[] = ['pending','routing','geocoding','artists','spotify','complete']

interface Props { status: JobStatus | string; progress: JobProgress | null }

export function ProgressView({ status, progress }: Props) {
  const currentIdx = ORDER.indexOf(status as JobStatus)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {STEPS.map(({ key, label }, i) => {
        const stepIdx = ORDER.indexOf(key)
        const done    = currentIdx > stepIdx
        const active  = currentIdx === stepIdx
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: done ? '#1db954' : active ? '#1db95430' : '#eee',
              border: active ? '2px solid #1db954' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              color: done ? 'white' : active ? '#1db954' : '#aaa',
            }}>
              {done ? '✓' : i + 1}
            </div>
            <div>
              <div style={{ fontWeight: active ? 600 : 400, color: done || active ? '#1a1a1a' : '#aaa' }}>{label}</div>
              {active && progress?.message && (
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{progress.message}</div>
              )}
            </div>
          </div>
        )
      })}

      {status === 'failed' && (
        <div style={{ marginTop: 16, padding: 16, background: '#fff0f0', borderRadius: 8, color: '#c00' }}>
          Something went wrong: {progress?.message}
        </div>
      )}
    </div>
  )
}
