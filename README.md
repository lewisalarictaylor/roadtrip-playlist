# Roadtrip Playlist

Generate a Spotify playlist of artists from every town and city along your road trip route. Enter an origin and destination, and the app builds you a soundtrack of local acts — in route order.

## How it works

1. The route is fetched from the Google Maps Directions API
2. Points are sampled every N km along the route and reverse-geocoded to city/town names
3. Each place is looked up in MusicBrainz to find artists from that area
4. Artists are matched on Spotify and their top tracks are added to a new playlist
5. Progress streams live to the browser via Server-Sent Events

---

## Prerequisites

You'll need the following installed before you start:

- **Node.js** v20 or later
- **PostgreSQL** v14 or later
- **Redis** v7 or later

And accounts/API keys for:

- [Google Cloud Console](https://console.cloud.google.com) — for Maps and Geocoding APIs
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) — for playlist creation
- MusicBrainz — free, no key required (just register an app name)

---

## 1. Clone and install

```bash
git clone https://github.com/yourname/roadtrip-playlist.git
cd roadtrip-playlist
npm install
```

This installs dependencies for both the `client` and `server` workspaces in one step.

---

## 2. Set up the database

Create a Postgres database:

```bash
createdb roadtrip_playlist # maybe: sudo -u postgres createdb roadtrip_playlist
```

Run the schema:

```bash
psql roadtrip_playlist < server/src/db/schema.sql # sudo -u postgres beforehand (hacky rather than wasting time setting up other users)
```

---

## 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Then fill in each value in `.env`:

```env
# Server
PORT=4000
NODE_ENV=development
SESSION_SECRET=          # any long random string, e.g. openssl rand -hex 32

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roadtrip_playlist

# Redis
REDIS_URL=redis://localhost:6379

# Google Maps
GOOGLE_MAPS_API_KEY=     # see below

# Spotify
SPOTIFY_CLIENT_ID=       # see below
SPOTIFY_CLIENT_SECRET=   # see below
SPOTIFY_REDIRECT_URI=http://localhost:4000/api/auth/spotify/callback

# MusicBrainz (no key needed — just identify your app)
MUSICBRAINZ_APP_NAME=RoadtripPlaylist
MUSICBRAINZ_APP_VERSION=1.0.0
MUSICBRAINZ_CONTACT_URL=https://yourapp.com
```

### Getting your Google Maps API key

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a project
2. Enable the **Directions API** and **Geocoding API**
3. Go to **APIs & Services → Credentials → Create credentials → API key**
4. Optionally restrict the key to those two APIs only

### Getting your Spotify credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app
2. Copy the **Client ID** and **Client Secret**
3. Under **Edit Settings**, add `http://localhost:4000/api/auth/spotify/callback` to the **Redirect URIs** list and save

---

## 4. Start Redis

If Redis isn't already running:

```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu / Debian
sudo systemctl start redis

# Docker (quickest option)
docker run -d -p 6379:6379 redis:7
```

---

## 5. Run the app

```bash
npm run dev
```

This starts both servers concurrently:

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:3000 |
| Backend (Fastify) | http://localhost:4000 |

The Vite dev server proxies all `/api` requests to Fastify automatically — no CORS configuration needed during development.

Open http://localhost:3000, connect your Spotify account, and generate your first playlist.

---

## Project structure

```
roadtrip-playlist/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # Route-level page components
│       ├── components/      # ProgressView, ResultsView, SettingsPanel
│       └── store/           # Zustand stores (auth, job)
├── server/                  # Node.js + Fastify backend
│   └── src/
│       ├── routes/          # auth, jobs, sse
│       ├── services/        # maps, musicbrainz, spotify
│       ├── jobs/            # BullMQ queue, worker, progress emitter
│       └── db/              # Postgres client, schema.sql
└── shared/
    └── types.ts             # Types shared between client and server
```

---

## Configurable playlist settings

All settings can be adjusted in the UI before generating a playlist:

| Setting | Default | Description |
|---------|---------|-------------|
| Tracks per artist | 2 | How many top tracks to add per artist (1–5) |
| Max artists per city | 3 | Cap on artists per place |
| Sampling interval | 20 km | How frequently to sample the route |
| Playlist order | Route order | Order artists appear in the playlist |
| Fallback to region | On | Expand to county if a small town has no artists |
| Playlist visibility | Private | Public or private on Spotify |

---

## MusicBrainz rate limiting

MusicBrainz enforces a limit of 1 request per second for all users. The app handles this automatically using a `p-queue` throttle in `server/src/services/musicbrainz.ts`. Results are cached in Postgres so repeat lookups for the same city never hit the API again.

For high-traffic use, see the [MusicBrainz mirror documentation](https://musicbrainz.org/doc/MusicBrainz_Server/Setup) to self-host a local database replica with no rate limit.

---

## Building for production

```bash
npm run build
```

This compiles the TypeScript server to `server/dist/` and bundles the React client to `client/dist/`.

To run the compiled server:

```bash
cd server && node dist/index.js
```

Serve `client/dist/` via any static file host (Nginx, Caddy, Vercel, etc.) and point `SPOTIFY_REDIRECT_URI` and the Vite proxy at your production domain.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Zustand |
| Backend | Node.js, Fastify 4 |
| Job queue | BullMQ + Redis |
| Database | PostgreSQL |
| Route data | Google Maps Directions + Geocoding APIs |
| Artist data | MusicBrainz |
| Playlist | Spotify Web API |
