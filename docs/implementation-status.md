# POV EventCamera Implementation Status

Last updated: 2026-02-11

This document tracks what has been implemented vs what is still pending.

## Completed

### Product and architecture artifacts
- [x] Guest flow documentation (`docs/guest-flow-doc.md`)
- [x] Organizer flow documentation (`docs/organizer-flow-doc.md`)
- [x] Backend architecture documentation (`docs/backend-architecture-doc.md`)
- [x] API architecture documentation (`docs/api-architecture-doc.md`)
- [x] OpenAPI draft contract (`openapi/poveventcam.yaml`)

### Monorepo and workspace setup
- [x] Monorepo workspace structure (`apps/*`, `packages/*`)
- [x] Shared root scripts for development and checks (`package.json`)
- [x] TypeScript workspace baseline (`tsconfig.base.json`)

### API foundation
- [x] Express API app bootstrap and middleware chain (`apps/api/src/app.ts`)
- [x] Request ID, not-found, and error handling middleware
- [x] Route registration for guest/organizer/webhooks

### Supabase + database foundation
- [x] Supabase-backed environment config for API (`apps/api/src/config/env.ts`)
- [x] Postgres connection + transaction helpers (`apps/api/src/lib/db.ts`)
- [x] Supabase helper for auth token verification + storage signed URL creation (`apps/api/src/lib/supabase.ts`)
- [x] Initial SQL migration created (`apps/api/db/migrations/0001_init.sql`)
- [x] Media uploader/tags migration (`apps/api/db/migrations/0002_media_uploader_tags.sql`)
- [x] Download selected migration (`apps/api/db/migrations/0003_download_selected.sql`)
- [x] DB setup/check scripts created (`apps/api/scripts/db/setup.sh`, `apps/api/scripts/db/check.sh`)
- [x] API workspace scripts wired (`db:setup`, `db:check`)

### Organizer backend (implemented against DB)
- [x] Organizer bearer auth middleware with organizer upsert (`apps/api/src/middleware/organizer-auth.ts`)
- [x] Organizer controller moved from stub to async handlers (`apps/api/src/modules/organizer/organizer.controller.ts`)
- [x] Organizer service implemented with DB queries (`apps/api/src/modules/organizer/organizer.service.ts`)
- [x] Endpoints implemented:
  - [x] Events create/list/get/patch
  - [x] Event close/archive
  - [x] Gallery list + stats
  - [x] Hide/unhide/bulk-hide media
  - [x] Single media download URL
  - [x] Download-all job create + poll
  - [x] Download-selected job create + poll (NEW)
  - [x] Guest list + deactivate guest
  - [x] Capacity update with payment redirect behavior

### Guest backend (implemented against DB)
- [x] Guest controller moved from stubs to async handlers (`apps/api/src/modules/guest/guest.controller.ts`)
- [x] Guest service implemented with DB + storage operations (`apps/api/src/modules/guest/guest.service.ts`)
- [x] Endpoints implemented:
  - [x] `POST /api/lookup-event` (NEW - returns event info without registering)
  - [x] `POST /api/join`
  - [x] `GET /api/my-session`
  - [x] `PATCH /api/my-session`
  - [x] `POST /api/create-upload`
  - [x] `POST /api/complete-upload`
  - [x] `GET /api/my-uploads`
- [x] Guest cookie/session token hashing and validation logic
- [x] Guest quota and event state enforcement logic
- [x] Upload reservation/finalization with Supabase Storage signed URL flow

### API client packages
- [x] Organizer API client implemented (`packages/api-client/src/organizer/*`)
- [x] Core HTTP client, error envelope support, auth/idempotency support (`packages/api-client/src/core/*`)
- [x] Download selected endpoint added to organizer client

### Organizer web app
- [x] Next.js organizer app scaffold (`apps/web-organizer`)
- [x] Supabase auth flows (password, magic link, Google OAuth)
- [x] Auth context/provider and auth gate
- [x] **UI modernization with shadcn/ui + Tailwind CSS v4** (NEW)
  - [x] Clean & minimal design (Linear/Vercel inspired)
  - [x] Responsive layout with proper breakpoints
  - [x] shadcn/ui components: Button, Card, Input, Badge, Alert, Dialog, Checkbox, Separator
- [x] Organizer dashboard shell wired to API client:
  - [x] List events with status badges
  - [x] Create event form in modal popup (NEW)
  - [x] Close/archive actions
- [x] Organizer gallery page implemented (`/events/:id/gallery`)
  - [x] Responsive image grid view
  - [x] Filter by uploader name
  - [x] Filter by tags
  - [x] Tags displayed below each image
  - [x] Individual download
  - [x] Bulk download job trigger + polling + links
  - [x] **Image preview overlay with navigation** (NEW)
    - [x] Full-screen preview with keyboard navigation (arrow keys, Escape)
    - [x] Previous/next buttons
    - [x] Download from preview
    - [x] Image metadata and tags in preview
  - [x] **Image selection for bulk download** (NEW)
    - [x] Checkbox selection (visible on hover, always visible in selection mode)
    - [x] Long press to select on touch devices with haptic feedback
    - [x] Select all / deselect all
    - [x] Download selected button
    - [x] Selection mode: click to toggle selection, eye icon to preview
- [x] Vercel deployment-compatible setup for Next.js

### Guest web app (MVP)
- [x] Next.js guest app scaffold (`apps/web-guest`)
- [x] **UI modernization with shadcn/ui + Tailwind CSS v4**
  - [x] Clean & minimal design
  - [x] Responsive mobile-first layout
  - [x] shadcn/ui components: Button, Card, Input, Badge, Alert
- [x] Mobile-first guest UI flow
- [x] **Landing page with event details** (NEW)
  - [x] Shows event name and date before joining
  - [x] Name input required during registration
  - [x] PIN input only shown if event requires PIN
  - [x] Explicit "Join Event" button (no auto-registration)
- [x] Cookie-backed session after joining
- [x] **Name tag display with edit mode** (NEW)
  - [x] Shows name as text with Edit button
  - [x] Click Edit to switch to input mode
  - [x] Save/Cancel buttons in edit mode
- [x] Per-file tags entry in upload queue
- [x] Direct upload flow wired: `create-upload` -> storage PUT -> `complete-upload`
- [x] My uploads gallery with thumbnail preview, uploader name, and tags

### Repository checks
- [x] `npm run ci:check` passing with current implementation

## Partially Completed

### Organizer downloads
- [~] Download-all endpoint and job polling exist.
- [~] Download-selected endpoint and job polling exist.
- [~] ZIP generation is still simulated in API service (no real archive worker pipeline yet).
- [ ] Real archive generation + storage upload + cleanup lifecycle still pending.

### Payment flow
- [~] Payment redirect response contract exists in organizer APIs.
- [ ] Real payment provider integration and webhook reconciliation not implemented.

### Guest backend hardening
- [~] Complete-upload currently verifies storage object existence.
- [ ] Add stricter metadata verification at complete-upload (size/content-type checks) to fully match architecture notes.
- [ ] Add API integration tests for guest endpoints.

### Guest frontend hardening
- [~] Guest upload flow is implemented for mobile-first web.
- [ ] Add robust offline queue (IndexedDB + retry/backoff + web lock leader election).
- [ ] Add client-side compression/conversion parity (`compressed` vs `raw` mode behavior).
- [ ] Add better progress reporting and retry UX for failed uploads.

## Pending Implementation

### Webhooks (high priority)
- [ ] Implement `POST /api/webhooks/payment` handler
- [ ] Signature verification and idempotency for webhook events
- [ ] Event fee/payment state transitions in DB

### Organizer frontend completeness
- [ ] Event detail page
- [ ] Guest management UI
- [ ] Capacity editing and payment redirect flow UI

### Organizer mobile app
- [ ] Replace placeholder with real mobile implementation (`apps/mobile-organizer`)
- [ ] Auth/session management on mobile
- [ ] Core organizer flows on mobile (event list/detail/gallery actions)

### Security hardening
- [ ] Add strict authorization tests for event ownership boundaries
- [ ] Define and apply Row Level Security policies where required
- [ ] Formalize secrets handling and environment separation by stage
- [ ] Add request throttling/rate limiting strategy

### Data and migrations
- [ ] Add forward migration strategy beyond bootstrap SQL files
- [ ] Add seed scripts for dev/test data
- [ ] Add rollback strategy or migration framework (if desired)

### Background jobs and async workflows
- [ ] Implement real worker process for heavy jobs (ZIP, cleanup, retention)
- [ ] Add job retry/backoff and monitoring

### Testing and quality
- [ ] API integration tests (guest + organizer + webhook)
- [ ] Contract tests against OpenAPI spec
- [ ] Frontend tests for organizer auth and dashboard flows
- [ ] End-to-end smoke tests for core user journeys

### Observability and operations
- [ ] Structured logging around request_id/event_id/session_id/media_id
- [ ] Metrics and alerting for API errors and job failures
- [ ] Environment-specific deployment runbooks

## Recent Changes (2026-02-11)

### Guest Landing Page Redesign
- **Event lookup endpoint**: New `POST /api/lookup-event` returns event details (name, date, requires_pin) without registering the guest
- **Landing page**: Shows event name and date prominently before joining
- **Registration flow**: Name is collected during registration (required field), PIN only shown if event requires it
- **Explicit join**: Guests must click "Join Event" button - no auto-registration
- **Name tag UX**: After joining, name shows as text with Edit button; click to enter edit mode with Save/Cancel

### API Updates
- New endpoint: `POST /api/lookup-event` for fetching event info without registering
- Returns: `{ id, slug, name, status, requires_pin, expires_at, event_date }`

---

## Changes (2026-02-10)

### UI Modernization
- Migrated both web apps to **Tailwind CSS v4** with CSS-based theme configuration
- Integrated **shadcn/ui** component library with Radix UI primitives
- Applied clean & minimal design aesthetic inspired by Linear/Vercel
- Full responsive support across mobile, tablet, and desktop

### Organizer Gallery Enhancements
- **Image Preview Overlay**: Full-screen preview with keyboard navigation (←/→/Esc), download button, metadata display
- **Image Selection**: Checkbox-based selection with long-press support for touch devices, haptic feedback
- **Bulk Download Selected**: New API endpoint `POST /events/:id/download-selected` with `media_ids` parameter
- **Selection Mode UX**: When items are selected, clicking toggles selection; use eye icon to preview

### API Updates
- New endpoint: `POST /api/organizer/events/:id/download-selected`
- New migration: `0003_download_selected.sql` (adds `media_ids` column to `organizer_jobs`)
- Updated OpenAPI spec with `DownloadSelectedRequest` schema
- Updated api-client with `downloadSelected()` method

### Organizer Dashboard
- Create event form now opens in a modal dialog instead of inline form

## Suggested Next Milestones

1. Payment webhook implementation + real billing transitions.
2. Organizer gallery/download pipeline with real async worker (ZIP generation).
3. Guest frontend hardening (offline queue, compression, retry UX).
4. Mobile organizer app MVP.
5. Event detail page and guest management UI.
