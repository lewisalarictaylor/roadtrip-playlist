import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJobStore } from '../store/job.ts'
import { useAuthStore } from '../store/auth.ts'
import { SettingsPanel } from '../components/SettingsPanel.tsx'

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { createJob } = useJobStore()
  const navigate = useNavigate()

  const [origin, setOrigin]             = useState('')
  const [destination, setDestination]   = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch a route preview whenever both fields have enough content.
  // Debounced so we don't fire on every keystroke.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (origin.trim().length < 3 || destination.trim().length < 3) {
      setPreviewUrl(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const params = new URLSearchParams({ origin, destination })
        const res = await fetch(`/api/preview?${params}`, { credentials: 'include' })
        if (res.ok) {
          const blob = await res.blob()
          setPreviewUrl(URL.createObjectURL(blob))
        } else {
          setPreviewUrl(null)
        }
      } catch {
        setPreviewUrl(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [origin, destination])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination) return
    setLoading(true)
    const jobId = await createJob(origin, destination)
    navigate(`/job/${jobId}`)
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Roadtrip Playlist</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: 14 }}>{user?.display_name}</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #ddd', fontSize: 13, padding: '6px 14px' }}>
            Log out
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>From</span>
          <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Liverpool, UK" required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>To</span>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Edinburgh, UK" required />
        </label>
        <p style={{ fontSize: 12, color: '#999', margin: '-4px 0 0' }}>
          Include a country or region for best results — e.g. "Bristol, UK" rather than just "Bristol"
        </p>

        {/* Route preview */}
        {(previewUrl || previewLoading) && (
          <div style={{
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #eee',
            background: '#f5f5f3',
            aspectRatio: '640 / 300',
            position: 'relative',
          }}>
            {previewLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#999',
              }}>
                Loading map...
              </div>
            )}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Route preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: previewLoading ? 0 : 1, transition: 'opacity 0.2s' }}
              />
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowSettings(s => !s)}
          style={{ background: 'none', border: '1px solid #ddd', color: '#555', fontSize: 13, alignSelf: 'flex-start' }}
        >
          {showSettings ? 'Hide settings' : 'Customise playlist settings'}
        </button>

        {showSettings && <SettingsPanel />}

        <button
          type="submit"
          disabled={loading}
          style={{ background: '#1db954', color: 'white', fontWeight: 600, fontSize: 16, padding: '14px', marginTop: 8 }}
        >
          {loading ? 'Creating...' : 'Generate playlist'}
        </button>
      </form>
    </div>
  )
}
