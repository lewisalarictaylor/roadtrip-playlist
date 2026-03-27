import type { Job } from '../../../shared/types.ts'

interface Props { job: Job }

export function ResultsView({ job }: Props) {
  const totalArtists = job.cities.reduce((n, c) => n + c.artists.length, 0)
  const citiesWithArtists = job.cities.filter(c => c.artists.length > 0)
  const citiesWithoutArtists = job.cities.filter(c => c.artists.length === 0)
  const hasPlaylist = !!job.spotifyPlaylistUrl

  // Total empty — no artists found for any city
  if (totalArtists === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No artists found</div>
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
            We searched {job.cities.length} place{job.cities.length === 1 ? '' : 's'} along your route but
            couldn't find any artists in MusicBrainz for this area.
          </div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 12 }}>
            Try reducing the sampling interval so more towns are checked, or enabling
            the "fall back to region" setting to widen the search area.
          </div>
        </div>
        {job.cities.length > 0 && (
          <div style={{ fontSize: 13, color: '#888' }}>
            Places searched: {job.cities.map(c => c.name).join(', ')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stats */}
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

      {/* Spotify button — only shown if a playlist was actually created */}
      {hasPlaylist ? (
        <a
          href={job.spotifyPlaylistUrl!}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#1db954', color: 'white', fontWeight: 600, fontSize: 16, padding: '14px', borderRadius: 8, textAlign: 'center', display: 'block' }}
        >
          Open in Spotify
        </a>
      ) : (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '14px 16px', fontSize: 14, color: '#555' }}>
          Artists were found but none could be matched on Spotify, so no playlist was created.
          Try lowering the popularity threshold in settings.
        </div>
      )}

      {/* Cities with artists */}
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

      {/* Cities with no artists — collapsed summary, not silent */}
      {citiesWithoutArtists.length > 0 && (
        <div style={{ fontSize: 13, color: '#999', borderTop: '1px solid #eee', paddingTop: 16 }}>
          No artists found for: {citiesWithoutArtists.map(c => c.name).join(', ')}
        </div>
      )}

    </div>
  )
}
