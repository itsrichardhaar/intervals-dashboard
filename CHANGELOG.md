# Changelog

All notable changes to this project will be documented in this file.

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
