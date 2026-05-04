# Changelog

All notable changes to this project will be documented in this file.

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
