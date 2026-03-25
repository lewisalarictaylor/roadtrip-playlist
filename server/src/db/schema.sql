CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spotify_id    TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  status               TEXT NOT NULL DEFAULT 'pending',
  origin               TEXT NOT NULL,
  destination          TEXT NOT NULL,
  settings             JSONB NOT NULL DEFAULT '{}',
  spotify_playlist_id  TEXT,
  spotify_playlist_url TEXT,
  error                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_cities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  city_name   TEXT NOT NULL,
  route_order INT NOT NULL,
  mbid        TEXT,
  artists     JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE artist_cache (
  city_mbid   TEXT PRIMARY KEY,
  city_name   TEXT NOT NULL,
  artists     JSONB NOT NULL DEFAULT '[]',
  cached_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_job_cities_job_id ON job_cities(job_id);
CREATE INDEX idx_artist_cache_cached_at ON artist_cache(cached_at);
