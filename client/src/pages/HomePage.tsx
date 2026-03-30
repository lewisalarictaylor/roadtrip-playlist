import { useAuthStore } from '../store/auth.ts'
import { Navigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export function HomePage() {
  const { user } = useAuthStore()
  const heroRef = useRef<HTMLDivElement>(null)

  // Subtle parallax on the road illustration
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return
      const y = window.scrollY
      heroRef.current.style.transform = `translateY(${y * 0.3}px)`
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(248,247,244,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>Roadtrip Playlist</span>
        <a
          href="/api/auth/spotify"
          style={{
            background: '#1db954', color: 'white',
            padding: '9px 20px', borderRadius: 40,
            fontWeight: 600, fontSize: 13, letterSpacing: '0.1px',
          }}
        >
          Connect with Spotify
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px',
        overflow: 'hidden', position: 'relative',
      }}>

        {/* Road illustration — CSS only */}
        <div ref={heroRef} style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 320, pointerEvents: 'none',
        }}>
          {/* Road surface */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: '120%', height: '100%',
            background: 'linear-gradient(to top, #d4cfc6 0%, transparent 100%)',
            clipPath: 'polygon(35% 100%, 65% 100%, 80% 0%, 20% 0%)',
          }} />
          {/* Centre line dashes */}
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{
              position: 'absolute',
              bottom: i * 48 + 20, left: '50%',
              transform: 'translateX(-50%)',
              width: 3, height: 24,
              background: '#bbb8b0',
              borderRadius: 2,
              opacity: 1 - i * 0.15,
            }} />
          ))}
        </div>

        {/* City dots along the road */}
        {[
          { bottom: 60,  left: '38%',  label: 'Liverpool',   delay: '0.1s' },
          { bottom: 120, left: '44%',  label: 'Manchester',  delay: '0.2s' },
          { bottom: 190, left: '48%',  label: 'Leeds',       delay: '0.3s' },
          { bottom: 250, left: '51%',  label: 'York',        delay: '0.4s' },
        ].map(({ bottom, left, label, delay }) => (
          <div key={label} style={{
            position: 'absolute', bottom, left,
            display: 'flex', alignItems: 'center', gap: 6,
            animation: `fadeInUp 0.6s ease ${delay} both`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#1db954',
              boxShadow: '0 0 0 3px rgba(29,185,84,0.2)',
            }} />
            <span style={{ fontSize: 11, color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
          </div>
        ))}

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 600 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(29,185,84,0.1)',
            color: '#0f6e36',
            padding: '5px 14px', borderRadius: 40,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.5px',
            textTransform: 'uppercase', marginBottom: 24,
            animation: 'fadeInUp 0.5s ease both',
          }}>
            Powered by MusicBrainz + Spotify
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 800, lineHeight: 1.05,
            letterSpacing: '-2px', color: '#111',
            marginBottom: 24,
            animation: 'fadeInUp 0.5s ease 0.1s both',
          }}>
            Your road trip,<br />
            <span style={{ color: '#1db954' }}>scored.</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#555', lineHeight: 1.7,
            maxWidth: 480, margin: '0 auto 40px',
            animation: 'fadeInUp 0.5s ease 0.2s both',
          }}>
            Enter a route and we'll build you a Spotify playlist of artists
            from every town and city you'll pass through — in order.
          </p>

          <div style={{ animation: 'fadeInUp 0.5s ease 0.3s both' }}>
            <a
              href="/api/auth/spotify"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: '#1db954', color: 'white',
                padding: '16px 36px', borderRadius: 50,
                fontWeight: 700, fontSize: 16,
                boxShadow: '0 4px 24px rgba(29,185,84,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(29,185,84,0.45)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(29,185,84,0.35)'
              }}
            >
              {/* Spotify icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Connect with Spotify
            </a>
            <p style={{ marginTop: 14, fontSize: 12, color: '#aaa' }}>Free to use · No credit card required</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{
        maxWidth: 960, margin: '0 auto',
        padding: '80px 24px',
      }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800,
          letterSpacing: '-1px', textAlign: 'center',
          marginBottom: 12, color: '#111',
        }}>
          How it works
        </h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: 16, marginBottom: 56 }}>
          From postcode to playlist in under a minute.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
        }}>
          {[
            {
              step: '01',
              title: 'Enter your route',
              body: 'Type your origin and destination — anywhere with a road between them.',
              accent: '#e8f5e9',
            },
            {
              step: '02',
              title: 'We trace the road',
              body: 'Google Maps plots the route and we sample towns and cities along the way.',
              accent: '#f1f8e9',
            },
            {
              step: '03',
              title: 'Artists are matched',
              body: 'MusicBrainz tells us who\u2019s from each place. Spotify popularity decides who makes the cut.',
              accent: '#e8f5e9',
            },
            {
              step: '04',
              title: 'Playlist is built',
              body: 'Top tracks from each artist land in a new Spotify playlist, ordered by the route.',
              accent: '#f1f8e9',
            },
          ].map(({ step, title, body, accent }) => (
            <div key={step} style={{
              background: accent,
              padding: '36px 28px',
              borderRadius: step === '01' ? '16px 0 0 16px' : step === '04' ? '0 16px 16px 0' : 0,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                color: '#1db954', textTransform: 'uppercase', marginBottom: 16,
              }}>
                Step {step}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#111', letterSpacing: '-0.3px' }}>
                {title}
              </h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example route */}
      <section style={{
        background: '#111', color: 'white',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800,
            letterSpacing: '-1px', marginBottom: 12,
          }}>
            London → Edinburgh
          </h2>
          <p style={{ color: '#888', fontSize: 15, marginBottom: 48 }}>
            An example of what a 660km route might surface
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { city: 'London',      artists: ['Amy Winehouse', 'Dizzee Rascal', 'Blur'] },
              { city: 'Nottingham',  artists: ['Jake Bugg', 'Paper Lace', 'Dog is Dead'] },
              { city: 'Sheffield',   artists: ['Arctic Monkeys', 'Pulp', 'Human League'] },
              { city: 'Leeds',       artists: ['Kaiser Chiefs', 'Gang of Four'] },
              { city: 'Newcastle',   artists: ['Sting', 'Mark Knopfler', 'Maximo Park'] },
              { city: 'Edinburgh',   artists: ['Frightened Rabbit', 'Teenage Fanclub'] },
            ].map(({ city, artists }, i) => (
              <div key={city} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '18px 0',
                borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                  width: 20, flexShrink: 0,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i === 0 || i === 5 ? '#1db954' : '#444',
                    flexShrink: 0,
                  }} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{city}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{artists.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '100px 24px',
        textAlign: 'center',
        background: '#f8f7f4',
      }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800,
          letterSpacing: '-1.5px', marginBottom: 16, color: '#111',
          lineHeight: 1.1,
        }}>
          Ready to hit the road?
        </h2>
        <p style={{ color: '#666', fontSize: 16, marginBottom: 40, maxWidth: 400, margin: '0 auto 40px' }}>
          Connect your Spotify account and enter your route. Your playlist will be ready in under a minute.
        </p>
        <a
          href="/api/auth/spotify"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#1db954', color: 'white',
            padding: '16px 36px', borderRadius: 50,
            fontWeight: 700, fontSize: 16,
            boxShadow: '0 4px 24px rgba(29,185,84,0.3)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Get started free
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #eee',
        padding: '24px',
        textAlign: 'center',
        fontSize: 12, color: '#aaa',
      }}>
        Roadtrip Playlist · Built with MusicBrainz and the Spotify Web API
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}