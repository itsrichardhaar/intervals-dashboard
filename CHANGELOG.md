# Changelog

All notable changes to this project will be documented in this file.

---

## [0.1.21] - 2026-05-15

### Changed
- Renamed app title from "Project Dashboard" to "Springer OS" in browser tab and sidebar
- Updated favicon to Springer geometric S mark (SVG + ICO)

---

## [0.1.20] - 2026-05-06

### Fixed
- Vercel build failure after Prisma 7 migration — `PrismaClient` now uses the `@prisma/adapter-pg` driver adapter (required by Prisma 7 when `url` is not in `schema.prisma`)

---

## [0.1.19] - 2026-05-06

### Changed
- Upgraded Prisma from 5.22.0 to 7.8.0
- Moved database connection config from `schema.prisma` to `prisma.config.ts` (Prisma 7 requirement)
- Removed `directUrl` / `DIRECT_URL` — Prisma 7 uses a single direct connection URL; updated `.env.example` accordingly

---

## [0.1.18] - 2026-05-06

### Added
- Sync health indicator in sidebar footer — colour-coded dot + relative timestamp (green ≤15 min, yellow ≤30 min, red >30 min or failed); polls `/api/sync/status` every 2 minutes; shows "Syncing…" when a run is in progress
- Sortable columns on Project Overview — click Project / Client / Status / Budget headers to sort; arrow indicator on active column; sort preserved across filter changes via URL param (`?sort=budget&dir=desc`); Budget % sort puts no-estimate projects last
- Action Items: optional task-level linking — "Link to task" dropdown in AddActionItemForm; API validates task belongs to the project; linked task title shown in action item rows on project page and My Work

---

## [0.1.17] - 2026-05-06

### Added
- Due-date bucket filter on All My Tasks: Overdue / This Week / This Month / No Due Date pills, toggle behavior, combinable with status checkboxes, persists in `sessionStorage`
- `filterTasksByDate` pure function with 9 unit tests (201 total)
- Staleness filter on Project Overview: "Stale" toggle shows projects with no weekly update posted this ISO week; combinable with Client + Status filters, reflected in URL (`?stale=1`)
- `isStaleProject` and `currentISOWeekStart` pure functions with 9 unit tests

---

## [0.1.16] - 2026-05-06

### Added
- Status filter on All My Tasks: multi-select checkboxes (Open/In Progress/Internal Review/Client Review/Closed), default excludes Closed, instant client-side filtering, persists within session via `sessionStorage`
- `filterTasks` pure function with 11 unit tests (183 total)
- `FilteredTaskList` client component replaces the Open/All toggle
- Client + Project Status filters on Project Overview: Client dropdown + On Track/At Risk/Blocked pills, URL-based (shareable), server-side filtered render, combinable filters with "Clear filters" reset

---

## [0.1.15] - 2026-05-05

### Added
- `/daily-focus` page — logged-in user's Open and In Progress tasks, sorted overdue-first then ascending by due date with no-due-date tasks last
- "No due date" badge on undated tasks; "Due today" highlight in yellow; overdue row highlight in red
- `sortDailyFocusTasks` pure function with 9 unit tests (172 total)
- Daily Focus nav item in sidebar (added in v0.1.12, route now implemented)

---

## [0.1.14] - 2026-05-05

### Added
- `preferences Json?` column on User model with Prisma migration (`20260506124133_add_user_preferences`)
- `PUT /api/users/me/preferences` — authenticated endpoint to persist `{ theme, brightness, hue, intensity }` with range validation
- Settings page "Display Customization" section: Theme selector, Brightness/Intensity/Hue sliders with live preview and reset button
- `ThemeProvider` now syncs preferences to DB (debounced 600 ms) on every change
- Root layout loads server-side preferences from DB and bakes them into the flash-prevention script — no flash on first load from a new device

---

## [0.1.13] - 2026-05-05

### Added
- `computeThemeVars(theme, brightness, hue, intensity)` pure function — computes all 10 `--dash-*` CSS variable values in HSL space (10 unit tests)
- `ThemeProvider` client component — reads preferences from `localStorage` on mount, applies computed CSS variables to `document.documentElement`, re-applies on any pref change
- Flash-prevention inline script in root layout — applies correct theme vars synchronously before first React paint (no visible flash on reload)
- `useTheme()` hook for accessing/updating theme preferences from any client component
- `ThemeToggle` now wired to `ThemeProvider` context instead of direct `localStorage`

---

## [0.1.12] - 2026-05-05

### Added
- Mid/Dark/Light sidebar theme toggle — three-theme CSS variable system (`--dash-*` tokens) with `data-theme` attribute switching and `localStorage` persistence
- Lucide React icons replace emoji in sidebar navigation (Home, Target, FolderOpen, Users, ListChecks, Settings)
- Daily Focus nav item added to sidebar (links to `/daily-focus`)
- Orange accent (`#f5a524`) on active nav items via `text-dash-accent`

### Changed
- Global refactor: all hardcoded gray Tailwind classes replaced with semantic `dash-*` tokens across every page and component
- `globals.css` rewritten with `@theme inline` CSS variable registration for Tailwind v4 compatibility
- Active nav items use `bg-dash-surface-2 text-dash-accent` pattern

---

## [0.1.11] - 2026-05-05

### Changed
- Renamed "All Time" time window to "This Quarter" — now filters to the current calendar quarter (Q1–Q4)
- Bandwidth capacity denominators corrected: weekly = 40h, monthly = 160h, quarterly = 480h
- Bandwidth subtitle now shows free hours matching the available %, e.g. "21% available (31.5h free of 40h)"
- `BandwidthBar` label now says "week / month / quarter" depending on the active window
- `CAPACITY_HOURS` map exported from `bandwidth.ts`; `freeHours` and `capacityHours` added to `BandwidthResult`
- My Active Projects now shows a project health status badge (On Track / At Risk / Blocked); auto-detects At Risk from overdue tasks, respects manual overrides
- `parseTimeWindow` updated — "total" now falls back to "weekly"; "quarterly" is valid
- Added `startOfCurrentQuarter` and `endOfCurrentQuarter` to `dates.ts`
- 10 new tests (153 total)

---

## [0.1.10] - 2026-05-05

### Fixed
- Deleted boilerplate `src/app/page.tsx` that was shadowing `(dashboard)/page.tsx` — Personal Home now loads correctly at `/`
- Removed erroneous `prisma` import from `Sidebar.tsx` (client component)

### Added
- `GET /my-work/tasks` — All My Tasks: full table of tasks assigned to the user, overdue highlighted, Open/All toggle
- `GET /my-work/action-items` — My Action Items: open items with overdue/carried-over badges, complete button, recently completed section
- `GET /my-work` redirects to `/my-work/tasks`

---

## [0.1.9] - 2026-05-05

### Changed
- Moved cron bearer-token verification to `src/lib/cron/auth.ts` — it now owns all cron routes, not just the email routes
- Main `/api/sync` route now uses `verifyCronAuth` (previously had an unsafe `!==` string comparison vulnerable to timing attacks)
- Deleted `src/lib/intervals/syncAuth.ts`; all 10 route handlers updated to import from `@/lib/cron/auth`

### Security
- Fixed timing-attack vulnerability in `/api/sync` route where cron secret was compared with `!==`

---

## [0.1.8] - 2026-05-05

### Changed
- Extracted `bandwidthBarColor`, `bandwidthTextColor`, `bandwidthHexColor` into `bandwidth.ts`, consolidating 4 independent copies of the 90%/70% threshold logic
- Home, team bandwidth, project detail, and Monday digest email all delegate to the shared color helpers
- Added 12 new tests for the three color helpers (143 total)

---

## [0.1.7] - 2026-05-05

### Changed
- Extracted `startOfCurrentWeek`, `endOfCurrentWeek`, `isThisWeek`, `todayStart`, `parseTimeWindow` into `src/lib/dates.ts`, consolidating 4 independent copies of the ISO Monday week boundary calculation
- `bandwidth.ts` `isInTimeWindow`, home page, team bandwidth page, `actionItems.ts`, and `sender.ts` all delegate to the shared module
- Added 16 new tests for `dates.ts` (131 total)

---

## [0.1.6] - 2026-05-05

### Added
- Personal Home: "My Active Projects" section listing active projects with open task counts, derived from task assignments — closes #34
- Project Overview: "Team" column with initials chips (deterministic color, +N overflow) for assignees with open tasks — closes #35
- Project Overview: "Next Milestone" column showing earliest upcoming incomplete milestone title and due date — closes #35
- Project Detail: per-assignee bandwidth % shown in each task group header (green/yellow/red thresholds; "Not linked" for unmapped persons) — closes #36
- Settings: inline "Edit" button on each team member row opens a dropdown to reassign or remove their Intervals person mapping — closes #37
- `GET /api/intervals-people` endpoint returns all active IntervalsPeople for the settings dropdown
- `PUT /api/users/[id]/mapping` endpoint upserts or removes a user's Intervals mapping with `matchType: "manual"`

### Security
- Mapping PUT endpoint validates `intervalsPersonId` type at runtime and rejects empty strings with 400
- Invite POST endpoint now trims/lowercases email and validates format before DB insert

Closes #34, #35, #36, #37

---

## [0.1.5] - 2026-05-05

### Added
- Team Timeline page (`/team/timeline`) — weekly (Mon–Fri chip grid) and monthly (expandable calendar) views, with URL-driven week/month navigation and color-coded task/milestone chips
- `MonthlyCalendarGrid` client component — click a day to expand when more than 3 items exist
- Monday digest cron (`/api/email/monday-digest`, 08:00 UTC every Monday) — per-user email with bandwidth %, tasks due this week, open action items, and flagged task count
- Daily alerts cron (`/api/email/alerts`, 09:00 UTC daily) — overdue task, due-tomorrow, >80% budget, and missing-estimate alerts with `EmailSentLog` deduplication
- Pure email composition functions: `buildDigestEmail`, `buildOverdueAlert`, `buildDueTomorrowAlert`, `buildBudgetAlert`, `buildFlaggedTaskAlert` — all HTML-escaped and covered by 43 unit tests
- `getResend()` lazy Resend singleton and `FROM_ADDRESS` env-driven sender config
- XSS protection: HTML-escaped all user-data interpolations in email templates
- Auth hardening: `verifyCronAuth` now fails closed when `CRON_SECRET` is unset; uses `crypto.timingSafeEqual` for bearer token comparison

Closes #29, #30, #31, #32, #33

---

## [0.1.4] - 2026-05-05

### Added
- `syncMilestones` and `syncDocuments` sync functions with independent Vercel Cron jobs (`/api/sync/milestones` at :11, `/api/sync/documents` at :13 each 15-min cycle)
- Master `/api/sync` route now includes milestones and documents
- Individual project page: Milestones panel (sorted upcoming-first, completed greyed/struck-through, overdue warned) and Documents panel (linked titles)
- Archived project pages: "Archived" banner, read-only (Add forms hidden), breadcrumb links to archive list
- `/projects/archive` page: searchable by name/client, sortable by name or close date, shows historical update/action-item counts per project
- Active projects overview now filters to `status: "active"` only; inactive projects appear only in the archive

Closes #26, #27, #28

---

## [0.1.3] - 2026-05-05

### Added
- Team Bandwidth page (`/team/bandwidth`) — all linked team members with color-coded bandwidth bars (green <70%, yellow 70–90%, red ≥90%), remaining hours, and unlinked member notices
- `TimeWindowToggle` client component — Weekly / This Month / All Time toggle updates URL param and re-renders the server page
- Bandwidth toggle added to Personal Home and Team Bandwidth (closes #25)
- Project Overview table now shows the latest Weekly Status Update summary, author, and relative timestamp per project; "No updates yet" prompt links to project page (closes #22)
- Action items on the project detail page now show "Carried over" (yellow) and "Overdue" (red) badges derived at read time (closes #23)
- `isCarriedOver` and `isActionItemOverdue` pure functions in `src/lib/actionItems.ts` with 7 new unit tests; 50 total, all passing

Closes #21, #22, #23, #25

---

## [0.1.2] - 2026-05-05

### Added
- Individual project page (`/projects/[id]`) — tasks grouped by assignee with flagged/overdue highlighting, budget bar, action items, and status update feed
- `AddWeeklyStatusUpdateForm` — inline form to post On Track / At Risk / Blocked updates with free-text summary
- `AddActionItemForm` — inline form to create action items with assignee and optional due date
- `POST /api/projects/[id]/weekly-updates` — creates a `WeeklyStatusUpdate` record; validates status allowlist and requires non-empty summary
- `POST /api/projects/[id]/action-items` — creates an `ActionItem` tied to the project; validates assignee exists
- `PATCH /api/action-items/[id]` — any team member can now mark an action item complete (relaxed from assignee-only)
- 12 new unit tests for `validateWeeklyUpdateInput`, `getLatestUpdates`, and `validateActionItemInput`
- Project names in the overview table link to individual project pages

Closes #19, #20, #24

---

## [0.1.1] - 2026-05-05

### Added
- Project Overview page (`/projects`) — lists all active projects with name, client, status badge, and budget hours bar
- `ProjectStatusControl` dropdown badge — set On Track / At Risk / Blocked per project; Blocked requires a reason; Reset to auto removes override
- `PATCH /api/projects/[id]/status` — upserts or clears `ProjectStatusOverride`; validates status allowlist and requires reason for Blocked

Closes #17, #18

---

## [0.1.0] - 2026-05-05

### Added
- Full Intervals sync foundation: people, projects (active-only), tasks, and time entries
- Vercel cron jobs staggered every 15 minutes per resource
- Auth (NextAuth v5, credentials, JWT), invite-only user management
- Personal Home: bandwidth bar, tasks this week, flagged tasks, action items
- Settings: invite form, team member table, manual Intervals person mapping

---

## [0.0.18] - 2026-05-04

### Fixed
- Sync time-entries: reduce per-run cap to 10k entries (5 API calls) to fit within 60s timeout; history builds up across cron runs

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
