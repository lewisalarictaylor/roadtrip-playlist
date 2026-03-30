export function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: '#f8f7f4',
      }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: '#111', textDecoration: 'none' }}>
          Roadtrip Playlist
        </a>
        <a href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Back to home</a>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px 96px' }}>

        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: '#111', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 56 }}>
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <Section title="Overview">
          <P>
            Roadtrip Playlist is a free tool that generates Spotify playlists of artists from the towns and cities
            along a route you enter. This policy explains what data we collect, why we collect it, and how we handle it.
          </P>
          <P>
            We collect the minimum data needed to make the app work. We do not sell your data, show you
            advertisements, or share your information with third parties except where necessary to provide the service.
          </P>
        </Section>

        <Section title="Who we are">
          <P>
            Roadtrip Playlist is an independent project. For privacy-related questions or requests, contact us at:
          </P>
          <p style={{ background: 'white', border: '1px solid #eee', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#333', margin: '8px 0' }}>
            <strong>Email:</strong> privacy@roadtripplaylist.app
          </p>
          <P>We will respond to all requests within 30 days.</P>
        </Section>

        <Section title="What data we collect">
          <P>When you connect your Spotify account, we store:</P>
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#444', fontSize: 15 }}>
            <li>Your Spotify user ID and display name</li>
            <li>An access token and refresh token, used to create playlists on your behalf</li>
            <li>The expiry time of your access token</li>
          </ul>
          <P style={{ marginTop: 16 }}>When you generate a playlist, we store:</P>
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#444', fontSize: 15 }}>
            <li>The origin and destination you entered</li>
            <li>The towns and cities identified along the route</li>
            <li>The artists selected for each place</li>
            <li>The Spotify playlist ID and URL created</li>
            <li>The status and any error messages from the generation process</li>
          </ul>
          <P style={{ marginTop: 16 }}>
            We also maintain a cache of artist data for towns and cities. This cache contains publicly available
            information from MusicBrainz (artist names and tags) and Spotify (artist IDs and popularity scores).
            It does not contain any personal data. Cache entries are automatically deleted after 30 days.
          </P>
        </Section>

        <Section title="What we do not collect">
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#444', fontSize: 15 }}>
            <li>Your Spotify listening history or existing playlists</li>
            <li>Payment or financial information</li>
            <li>Location data from your device</li>
            <li>Any data from third-party tracking or advertising networks</li>
          </ul>
        </Section>

        <Section title="Why we need Spotify access">
          <P>
            We request the following Spotify permissions (scopes) when you connect your account:
          </P>
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#444', fontSize: 15 }}>
            <li><strong>user-read-private</strong> — to retrieve your Spotify user ID, which is required to create a playlist on your account</li>
            <li><strong>playlist-modify-private</strong> — to create private playlists on your behalf</li>
            <li><strong>playlist-modify-public</strong> — to create public playlists if you choose that option in settings</li>
          </ul>
          <P style={{ marginTop: 16 }}>
            We do not request access to your listening history, saved tracks, followed artists, or any other
            part of your Spotify account.
          </P>
        </Section>

        <Section title="Third-party services">
          <P>Your data passes through the following third-party services to operate the app:</P>

          <SubSection title="Spotify">
            Your Spotify user ID and tokens are used to authenticate you and create playlists.
            The route you enter is not sent to Spotify.
            Spotify's privacy policy is at{' '}
            <a href="https://www.spotify.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1db954' }}>
              spotify.com/privacy
            </a>.
          </SubSection>

          <SubSection title="Google Maps">
            The origin and destination you enter are sent to Google's Directions API to calculate the route,
            and to Google's Geocoding API to identify towns and cities along it.
            Google's privacy policy is at{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1db954' }}>
              policies.google.com/privacy
            </a>.
          </SubSection>

          <SubSection title="MusicBrainz">
            Town and city names are sent to MusicBrainz to look up artists from each area.
            No personal data is sent to MusicBrainz.
            MusicBrainz's privacy policy is at{' '}
            <a href="https://metabrainz.org/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1db954' }}>
              metabrainz.org/privacy
            </a>.
          </SubSection>

          <SubSection title="Railway (hosting)">
            The app and its database are hosted on Railway. Your data is stored on Railway's
            infrastructure. Railway's privacy policy is at{' '}
            <a href="https://railway.app/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1db954' }}>
              railway.app/legal/privacy
            </a>.
          </SubSection>
        </Section>

        <Section title="Cookies and sessions">
          <P>
            We use a single session cookie to keep you logged in. This cookie stores a session identifier —
            it does not contain your personal data directly. Session data is stored server-side in Redis and
            expires after 30 days of inactivity.
          </P>
          <P>
            This is a functional cookie necessary for the app to work. We do not use advertising cookies,
            analytics cookies, or any third-party tracking cookies.
          </P>
        </Section>

        <Section title="How long we keep your data">
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, color: '#444', fontSize: 15 }}>
            <li><strong>Your account and tokens</strong> — retained until you disconnect the app from Spotify or request deletion</li>
            <li><strong>Playlist generation history</strong> — retained until you request deletion</li>
            <li><strong>Artist cache</strong> — automatically deleted after 30 days</li>
            <li><strong>Session cookies</strong> — expire after 30 days of inactivity</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <P>
            Under UK GDPR and the Data Protection Act 2018, you have the right to:
          </P>
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#444', fontSize: 15 }}>
            <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            <li><strong>Correction</strong> — ask us to correct inaccurate data</li>
            <li><strong>Deletion</strong> — ask us to delete your data</li>
            <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Objection</strong> — object to how we process your data</li>
          </ul>
          <P style={{ marginTop: 16 }}>
            To exercise any of these rights, email us at <strong>privacy@roadtripplaylist.app</strong>.
            We will respond within 30 days.
          </P>
          <P>
            You can also disconnect Roadtrip Playlist from your Spotify account at any time by going to
            your{' '}
            <a href="https://www.spotify.com/account/apps/" target="_blank" rel="noopener noreferrer" style={{ color: '#1db954' }}>
              Spotify account settings
            </a>
            {' '}and revoking access. This does not automatically delete your data from our servers —
            contact us to request full deletion.
          </P>
        </Section>

        <Section title="Changes to this policy">
          <P>
            If we make significant changes to this policy, we will update the date at the top of this page.
            We encourage you to review it periodically.
          </P>
        </Section>

      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #eee',
        padding: '24px',
        textAlign: 'center',
        fontSize: 12, color: '#aaa',
      }}>
        Roadtrip Playlist · <a href="/" style={{ color: '#aaa' }}>Home</a>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: '#111',
        letterSpacing: '-0.3px', marginBottom: 16,
        paddingBottom: 12, borderBottom: '1px solid #eee',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7 }}>{children}</p>
    </div>
  )
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 15, color: '#444', lineHeight: 1.8, marginBottom: 12, ...style }}>
      {children}
    </p>
  )
}
