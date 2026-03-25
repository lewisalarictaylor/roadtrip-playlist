import { useAuthStore } from '../store/auth.ts'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  if (user) { navigate('/dashboard'); return null }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
      <h1 style={{ fontSize: 36, fontWeight: 700 }}>Roadtrip Playlist</h1>
      <p style={{ color: '#666', maxWidth: 420, textAlign: 'center', fontSize: 18 }}>
        Enter your route and we'll build you a Spotify playlist of artists from every town and city along the way.
      </p>
      <a
        href="/api/auth/spotify"
        style={{ background: '#1db954', color: 'white', padding: '14px 32px', borderRadius: 40, fontWeight: 600, fontSize: 16 }}
      >
        Connect with Spotify
      </a>
    </div>
  )
}
