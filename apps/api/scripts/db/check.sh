#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required. Export it before running this script."
  exit 1
fi

psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 <<'SQL'
SELECT
  (SELECT COUNT(*) FROM events) AS events,
  (SELECT COUNT(*) FROM organizers) AS organizers,
  (SELECT COUNT(*) FROM event_organizers) AS event_organizers,
  (SELECT COUNT(*) FROM device_sessions) AS device_sessions,
  (SELECT COUNT(*) FROM media) AS media,
  (SELECT COUNT(*) FROM organizer_jobs) AS organizer_jobs;
SQL
