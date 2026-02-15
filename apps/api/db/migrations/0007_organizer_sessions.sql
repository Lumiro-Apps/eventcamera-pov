-- Organizer API session storage for cookie-based web auth.

CREATE TABLE IF NOT EXISTS organizer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizer_sessions_organizer
  ON organizer_sessions(organizer_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_organizer_sessions_expires
  ON organizer_sessions(expires_at);
