# eventcamera-pov

POV EventCamera monorepo scaffold.

## Workspace Layout

- `apps/api` - backend API
- `apps/web-guest` - guest web app
- `apps/web-organizer` - organizer web app
- `apps/mobile-organizer` - organizer mobile app
- `packages/api-client` - shared typed API client
- `packages/organizer-core` - shared organizer domain logic
- `packages/shared-types` - shared types
- `openapi/poveventcam.yaml` - API contract

## Commands

- `npm run ci:check` - run repository checks
- `npm run db:setup` - apply Supabase schema migration
- `npm run db:check` - verify core table availability/counters
- `npm run dev:api` - start API app (Express scaffold)
- `npm run dev:web-guest` - start guest web app (Next.js, mobile-first upload flow)
- `npm run dev:web-organizer` - start organizer web app (Next.js)
- `npm run dev:mobile-organizer` - start organizer mobile app (placeholder script)

## Supabase Setup (API)

1. Copy `apps/api/.env.example` to `apps/api/.env.local` and fill values.
   Use Supabase `Publishable key` as `SUPABASE_PUBLISHABLE_KEY` and Supabase `Secret key` as `SUPABASE_SECRET_KEY`.
2. Export `SUPABASE_DB_URL` in your shell.
3. Apply schema:
   `npm run db:setup`
4. Optional schema check:
   `npm run db:check`
5. Start API with env loaded:
   `set -a; source apps/api/.env.local; set +a; npm run dev:api`

## Organizer Web Auth Setup

1. Copy `apps/web-organizer/.env.example` to `apps/web-organizer/.env`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, and `NEXT_PUBLIC_API_BASE_URL`.
3. Run `npm run dev:web-organizer`.
4. Organizer gallery route format: `/events/{event_id}/gallery`.

## Guest Web Setup

1. Copy `apps/web-guest/.env.example` to `apps/web-guest/.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL` (for local API use `http://localhost:3000`).
3. Run `npm run dev:web-guest`.

## Vercel Hosting (Organizer Web)

- Set Vercel project root to `apps/web-organizer`.
- Build command: `npm run build --workspace @poveventcam/web-organizer`
- Framework preset: `Next.js`
- Configure env vars from `apps/web-organizer/.env.example`.
