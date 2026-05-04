# Changelog

All notable changes to this project will be documented in this file.

---

## [0.0.17] - 2026-05-04

### Changed
- Sync projects: only sync active projects (skip archived/inactive) to reduce record count and DB load
- Sync projects: marks previously-active projects inactive when they're archived in Intervals

### Fixed
- Sync projects + tasks: replaced sequential upsert loops with a single PostgreSQL `unnest` bulk upsert — one DB round-trip regardless of record count, solving cross-region latency timeouts

---

## [0.0.16] - 2026-05-04

### Fixed
- Sync: Intervals API does not support `page` parameter on any endpoint — replaced with single high-limit requests (projects: 2000, tasks: 3000, people: 1000) and offset-based pagination for time entries
- Sync: time-entries now uses `offset` instead of `page` for pagination, capped at 30k entries per run

---

## [0.0.15] - 2026-05-04

### Fixed
- Sync: fetch pages sequentially (not parallel) across all 4 resources to stay under 100 req/min Intervals rate limit
- Sync: stagger cron schedules by 2-3 minutes so all 4 jobs don't fire simultaneously

---

## [0.0.14] - 2026-05-04

### Fixed
- Sync time-entries: removed invalid `datestart` filter causing 400 from Intervals API
- Sync time-entries: added full pagination (capped at 30,000 entries to stay within 60s timeout)
- Sync time-entries: recompute `loggedHours` via DB `groupBy` after all upserts (avoids N+1 race)

---

## [0.0.13] - 2026-05-04

### Fixed
- Sync: corrected Intervals API field names for projects (`client`, `datestart`, `dateend`, `active`)
- Sync: corrected Intervals API field names for tasks (`estimate`, `datedue`)
- Sync: added full pagination to people (492 records), projects (1,278), and tasks (2,119)
- Sync: active-only filter for people (`active === "t"`); marks previously-active people inactive
- Sync: pre-fetch FK maps to avoid N+1 queries causing timeouts on tasks and time-entries

---

## [0.0.12] - 2026-05-04

### Added
- Personal Home — My Action Items section (closes #16)
  - Open Action Items assigned to current user shown above task list
  - "Carried over" yellow badge for items created before current week
  - "Overdue" red badge for items past their due date
  - Inline "Complete" button via `CompleteActionItemButton` client component
  - `PATCH /api/action-items/[id]` sets completedAt, restricted to assignee
  - Section hidden when no open items

---

## [0.0.11] - 2026-05-04

### Added
- Personal Home — Flagged Tasks section (closes #15)
  - Tasks with no estimated hours surfaced with red "Missing estimate" badge
  - Separate section below task list, hidden when empty

---

## [0.0.10] - 2026-05-04

### Added
- Personal Home — Bandwidth % + Tasks This Week (closes #14)
  - Color-coded bandwidth bar: green <70%, yellow 70–90%, red ≥90%
  - Available bandwidth and remaining hours displayed
  - Tasks due this week sorted by due date, overdue rows at top in red
  - Each task shows title, project, due date, estimated/logged hours, status badge
  - Unlinked users shown yellow notice linking to Settings

---

## [0.0.9] - 2026-05-04

### Added
- User–Intervals manual mapping API (`PUT /api/users/[id]/mapping`) — override auto-match in Settings (closes #13)
- Settings page: team member list with Intervals link status, manual mapping UI

---

## [0.0.8] - 2026-05-04

### Added
- User–Intervals email auto-match on first login (`src/lib/mapping/autoMatch.ts`) — links dashboard user to Intervals person by email, skips if already mapped (closes #12)

---

## [0.0.7] - 2026-05-04

### Added
- Invite-only user creation: `POST /api/users` generates a temp password, `GET /api/users` lists team (closes #10)
- Settings page (`/settings`) — invite form, team table with Intervals link status
- Vercel Cron job wiring (`vercel.json`) — fires `GET /api/sync` every 15 minutes with Bearer auth (closes #11)
- Sync API route (`/api/sync`) — runs all four sync jobs sequentially, writes SyncLog, handles partial failures

---

## [0.0.6] - 2026-05-04

### Added
- Intervals sync — Time Entries (`src/lib/intervals/syncTimeEntries.ts`) — upserts time entries and aggregates loggedHours back onto each task (closes #9)

---

## [0.0.5] - 2026-05-04

### Added
- Intervals sync — Tasks (`src/lib/intervals/syncTasks.ts`) — upserts tasks, normalizes status strings to internal values (closes #8)

---

## [0.0.4] - 2026-05-04

### Added
- App shell: dashboard layout, Sidebar navigation, placeholder Home page
- Login page (`/login`) with NextAuth credentials sign-in, error handling, session redirect (closes #5)
- Intervals API client (`src/lib/intervals/client.ts`) — Basic auth with admin token
- Intervals sync — People (`src/lib/intervals/syncPeople.ts`) — upsert with active flag (closes #6)
- Intervals sync — Projects (`src/lib/intervals/syncProjects.ts`) — upsert with budget + dates (closes #7)

---

## [0.0.3] - 2026-05-04

### Added
- Project Status Calculator pure function (`src/lib/calculators/projectStatus.ts`)
  - Auto-calculates On Track / At Risk based on budget burn rate and overdue tasks
  - Boundary: tasks overdue >3 days trigger At Risk
  - Blocked status intentionally excluded (manual only per ADR-0003)
  - 12 unit tests — all passing

Closes #4

---

## [0.0.2] - 2026-05-04

### Added
- Bandwidth Calculator pure function (`src/lib/calculators/bandwidth.ts`)
  - Formula: `(Σ Remaining Hours) ÷ 40 × 100`
  - Remaining Hours = `estimated_hours - logged_hours`
  - Qualifying statuses: Open, In Progress, In Internal Review, In Client Review
  - Time Window filtering: Weekly, Monthly, Total
  - Tasks with null/zero estimated hours flagged and excluded
  - 14 unit tests — all passing
- Vitest configured (`vitest.config.ts`)

Closes #3

---

## [0.0.1] - 2026-05-04

### Added
- Next.js 16 app with TypeScript, Tailwind CSS, App Router, `src/` layout
- Prisma 7 ORM with full schema covering all phases:
  - Auth: User, Account, Session, VerificationToken
  - Intervals sync: IntervalsPerson, IntervalsProject, IntervalsTask, IntervalsTimeEntry, IntervalsMilestone, IntervalsDocument, IntervalsTaskNote, IntervalsProjectNote
  - Dashboard-only: WeeklyStatusUpdate, ActionItem, ProjectStatusOverride
  - Infrastructure: UserIntervalsMapping, SyncLog, EmailSentLog
- NextAuth v5 (beta) with credentials provider and JWT sessions
- Route middleware protecting all pages except `/login`
- Prisma client singleton (`src/lib/prisma.ts`)
- NextAuth API route (`src/app/api/auth/[...nextauth]/route.ts`)
- `.env.example` with all required environment variables documented
- CONTEXT.md with full domain glossary
- docs/adr/ with 3 architecture decision records
- docs/PRD.md with full product requirements

Closes #2
