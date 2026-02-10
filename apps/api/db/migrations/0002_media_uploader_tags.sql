ALTER TABLE media
  ADD COLUMN IF NOT EXISTS uploader_name TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_media_event_uploader
  ON media(event_id, uploader_name);

CREATE INDEX IF NOT EXISTS idx_media_tags_gin
  ON media USING GIN(tags);
