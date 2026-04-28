CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  api_key    VARCHAR(64) UNIQUE NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  plan       VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS urls (
  id         BIGSERIAL PRIMARY KEY,
  slug       VARCHAR(12) UNIQUE NOT NULL,
  long_url   TEXT NOT NULL,
  user_id    BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active  BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clicks (
  id         BIGSERIAL PRIMARY KEY,
  slug       VARCHAR(12) NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash    TEXT,
  referrer   TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_urls_slug ON urls(slug);
CREATE INDEX IF NOT EXISTS idx_clicks_slug ON clicks(slug);