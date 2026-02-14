CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  max_guests INT NOT NULL DEFAULT 100,
  max_uploads_per_guest INT NOT NULL DEFAULT 10,
  compression_mode TEXT NOT NULL DEFAULT 'compressed'
    CHECK (compression_mode IN ('compressed', 'raw')),
  total_fee INT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  pin_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'closed', 'archived', 'purged')),
  cover_image_path TEXT,
  event_date DATE NOT NULL,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_organizers (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'collaborator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, organizer_id)
);

CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_event ON device_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON device_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON device_sessions(event_id, is_active);

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  device_session_id UUID NOT NULL REFERENCES device_sessions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumb_path TEXT,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploaded', 'failed', 'expired', 'hidden')),
  width INT,
  height INT,
  duration INT,
  uploaded_at TIMESTAMPTZ,
  storage_deleted_at TIMESTAMPTZ,
  storage_delete_attempts INT NOT NULL DEFAULT 0,
  storage_last_delete_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_session ON media(device_session_id, status);
CREATE INDEX IF NOT EXISTS idx_media_event ON media(event_id, status);
CREATE INDEX IF NOT EXISTS idx_media_pending_cleanup
  ON media(status, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_media_storage_cleanup
  ON media(status, storage_deleted_at, created_at)
  WHERE status = 'expired' AND storage_deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS organizer_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('download_all')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  exclude_hidden BOOLEAN NOT NULL DEFAULT true,
  download_url TEXT,
  download_urls TEXT[],
  file_size_bytes BIGINT,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizer_jobs_owner_status
  ON organizer_jobs(organizer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizer_jobs_event
  ON organizer_jobs(event_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organizers (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1),
      'Organizer'
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();
