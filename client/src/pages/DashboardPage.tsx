import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJobStore } from '../store/job.ts'
import { useAuthStore } from '../store/auth.ts'
import { SettingsPanel } from '../components/SettingsPanel.tsx'

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { createJob } = useJobStore()
  const navigate = useNavigate()

  const [origin, setOrigin]           = useState('')
  const [destination, setDestination] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading]         = useState(false)

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
          <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. London" required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>To</span>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Edinburgh" required />
        </label>

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
