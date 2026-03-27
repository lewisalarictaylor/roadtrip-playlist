import { useJobStore } from '../store/job.ts'

export function SettingsPanel() {
  const { settings, updateSettings } = useJobStore()

  return (
    <div style={{ background: '#f8f7f4', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid #eee' }}>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          Tracks per artist: <strong>{settings.tracksPerArtist}</strong>
        </span>
        <input type="range" min={1} max={5} value={settings.tracksPerArtist}
          onChange={e => updateSettings({ tracksPerArtist: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          Max artists per city: <strong>{settings.maxArtistsPerCity}</strong>
        </span>
        <input type="range" min={1} max={10} value={settings.maxArtistsPerCity}
          onChange={e => updateSettings({ maxArtistsPerCity: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          Route sampling interval: <strong>{settings.samplingIntervalKm}km</strong>
        </span>
        <input type="range" min={5} max={50} step={5} value={settings.samplingIntervalKm}
          onChange={e => updateSettings({ samplingIntervalKm: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Playlist order</span>
        <select value={settings.playlistOrder} onChange={e => updateSettings({ playlistOrder: e.target.value as any })}>
          <option value="route">Route order</option>
          <option value="shuffle">Shuffled</option>
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Playlist visibility</span>
        <select value={settings.playlistVisibility} onChange={e => updateSettings({ playlistVisibility: e.target.value as any })}>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={settings.fallbackToRegion}
          onChange={e => updateSettings({ fallbackToRegion: e.target.checked })} style={{ width: 'auto' }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Fall back to county/region if no city artists found</span>
      </label>

    </div>
  )
}
