#!/usr/bin/env sh
# Destructive: drops all objects in `public`, reapplies Drizzle migrations, then seeds globals.
# Requires: PostgreSQL client `psql`, repo-root `pnpm`, and `DATABASE_URL`.
#
# Local (from repo root):
#   pnpm run db:reset
#
# Render Shell (from the service root where package.json lives; DATABASE_URL is pre-set):
#   pnpm run db:reset
#
# Do not run against production unless you intend to delete every row.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"

# `drizzle-kit migrate` is a child process: variables from `server/.env` must be *exported*
# or migrate falls back to drizzle.config.ts default DB (e.g. …/dev) while `psql` and
# `db:seed` (dotenv) use `server/.env` — different databases, missing tables, seed errors.
if [ -z "${DATABASE_URL:-}" ] && [ -f "$REPO_ROOT/server/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$REPO_ROOT/server/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo 'error: DATABASE_URL is not set (export it or define it in server/.env)' >&2
  exit 1
fi

export DATABASE_URL

if ! command -v psql >/dev/null 2>&1; then
  echo 'error: psql not found; install PostgreSQL client tools' >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo 'error: pnpm not found' >&2
  exit 1
fi

echo 'WARNING: This will DROP schemas drizzle + public (all app data and Drizzle migration history) in this database.'
echo "Database: ${DATABASE_URL%%\?*}"

# Drizzle keeps its journal in schema `drizzle` (not `public`). Dropping only `public`
# leaves those rows behind, so `drizzle-kit migrate` reports success but reapplies nothing.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS drizzle CASCADE;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;
SQL

echo 'Applying migrations…'
pnpm run db:migrate

if ! psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc \
  "select exists(
     select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'exercise_types'
   );" | grep -qx t; then
  echo 'error: after migrate, public.exercise_types is missing — check DATABASE_URL is the same for psql and pnpm (export DATABASE_URL or use set -a with server/.env)' >&2
  exit 1
fi

echo 'Seeding globals (if none exist)…'
pnpm run db:seed

echo 'db:reset finished.'
