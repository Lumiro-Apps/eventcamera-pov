-- Introduce end_date and use event_date as the start date.
-- end_date is inclusive; default behavior is same-day events.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Backfill existing rows.
UPDATE events
SET end_date = COALESCE(end_date, event_date, DATE(expires_at), CURRENT_DATE);

-- Ensure valid range (end_date cannot be before event_date).
UPDATE events
SET end_date = event_date
WHERE end_date < event_date;

ALTER TABLE events
  ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_end_date_check;

ALTER TABLE events
  ADD CONSTRAINT events_end_date_check
  CHECK (end_date >= event_date);

CREATE INDEX IF NOT EXISTS idx_events_date_window
  ON events(event_date, end_date);
