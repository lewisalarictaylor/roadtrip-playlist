import type { Job } from '../../../shared/types.ts'

interface Props { job: Job }

export function ResultsView({ job }: Props) {
  const totalArtists = job.cities.reduce((n, c) => n + c.artists.length, 0)
  const citiesWithArtists = job.cities.filter(c => c.artists.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { label: 'Cities', value: job.cities.length },
          { label: 'Artists', value: totalArtists },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, background: '#f0f0ee', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, color: '#666' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {job.spotifyPlaylistUrl && (
        <a
          href={job.spotifyPlaylistUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#1db954', color: 'white', fontWeight: 600, fontSize: 16, padding: '14px', borderRadius: 8, textAlign: 'center', display: 'block' }}
        >
          Open in Spotify
        </a>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {citiesWithArtists.map(city => (
          <div key={city.name} style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #eee' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{city.name}</div>
            {city.artists.map(artist => (
              <div key={artist.mbid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', color: '#444' }}>
                <span>{artist.name}</span>
                {artist.spotifyUrl && (
                  <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1db954', fontSize: 13 }}>
                    Spotify
                  </a>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
