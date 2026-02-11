# Claude Code Instructions for POV EventCamera

This file contains project-specific instructions for Claude Code.

## Mandatory Steps After Code Changes

**Always update documentation when making code changes:**

1. **[implementation-status.md](docs/implementation-status.md)** - Update the "Recent Changes" section and relevant completed/pending items
2. **Flow documentation** - Update if the change affects user flows:
   - [guest-flow-doc.md](docs/guest-flow-doc.md) for guest-facing changes
   - [organizer-flow-doc.md](docs/organizer-flow-doc.md) for organizer-facing changes
3. **[design-guidelines.md](docs/design-guidelines.md)** - Update if adding new components or design patterns
4. **API documentation** - Update if adding/modifying API endpoints:
   - [api-architecture-doc.md](docs/api-architecture-doc.md)
   - [openapi/poveventcam.yaml](openapi/poveventcam.yaml)

## Project Structure

- `apps/api` - Express backend API
- `apps/web-guest` - Next.js guest web app
- `apps/web-organizer` - Next.js organizer web app
- `packages/api-client` - Shared API client library
- `docs/` - Documentation files

## Tech Stack

- Next.js 16.1.6 with React 19.2.4
- Tailwind CSS v4 with CSS-based theme configuration
- shadcn/ui component library
- Express.js backend with PostgreSQL (Supabase)

## Architecture Rules

**Keep the frontend dumb:**

- All business logic and validation must live in the backend
- Frontend should only handle:
  - UI rendering and user interactions
  - Calling API endpoints
  - Displaying data returned from the API
  - Basic form validation for UX (but backend must re-validate)
- Frontend should NOT:
  - Make business decisions
  - Calculate derived values that affect business logic
  - Implement security checks (backend is the source of truth)
  - Store authoritative state (server is authoritative)

**Backend is the source of truth:**

- All validation happens server-side
- All authorization checks happen server-side
- Quotas, limits, and constraints are enforced server-side
- Frontend can show optimistic UI but must handle server rejections

## Code Style

- TypeScript strict mode
- ESLint + Prettier formatting
- Use shadcn/ui components for UI
- Follow design guidelines in docs/design-guidelines.md
