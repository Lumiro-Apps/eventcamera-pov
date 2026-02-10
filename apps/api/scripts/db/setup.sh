#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required. Export it before running this script."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/../../db/migrations"

mapfile -t MIGRATION_FILES < <(find "${MIGRATIONS_DIR}" -maxdepth 1 -type f -name '*.sql' | sort)

if [[ "${#MIGRATION_FILES[@]}" -eq 0 ]]; then
  echo "No migration files found in ${MIGRATIONS_DIR}"
  exit 1
fi

for migration in "${MIGRATION_FILES[@]}"; do
  echo "Applying migration: ${migration}"
  psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -f "${migration}"
done

echo "Supabase schema setup complete."
