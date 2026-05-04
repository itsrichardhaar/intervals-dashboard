# PRD: Project Dashboard

## Problem Statement

Our team uses Intervals for task and time tracking but lacks a clear, consolidated view of assigned work, deadlines, and team capacity. As a result, tasks are missed, deadlines slip, and we cannot confidently answer whether a team member has bandwidth to take on new work. We currently maintain a separate Google Doc to summarize weekly project progress — an additional manual step that duplicates effort and falls out of sync with Intervals. There is no single place to understand what the team is working on, who is overloaded, and which projects are at risk — making it difficult to set accurate client expectations.

## Solution

A web-based internal project dashboard that syncs data from Intervals every 15–30 minutes and layers team communication and planning tools on top. The dashboard gives each team member a Personal Home showing their Bandwidth and tasks for the week, replaces the weekly Google Doc with a structured Project Overview page, and provides a Team Bandwidth grid so leadership can see capacity across the team at a glance. Action Items replace ad-hoc project to-dos. Email notifications surface overdue tasks and Monday morning summaries proactively.

## User Stories

### Authentication & Users

1. As a team member, I want to log in with an email and password, so that my personal view shows only my assigned work.
2. As a team member, I want my session to persist so that I don't have to log in on every visit.
3. As a team member, I want an account created for me by invite, so that no one outside the team can sign up.
4. As a team member, I want my dashboard account to automatically link to my Intervals person record by matching my email, so that my tasks and time entries appear without manual configuration.
5. As a team member, I want to manually map my dashboard account to my Intervals person record in Settings if my emails don't match, so that my data appears correctly regardless of email discrepancies.

### Personal Home

6. As a team member, I want to see my Bandwidth percentage for the current week on my home screen, so that I immediately know how committed I am this week.
7. As a team member, I want to see my Available Bandwidth for the week, so that I can communicate capacity when asked to take on new work.
8. As a team member, I want to see all my tasks due this week sorted by due date, so that I know what to work on first.
9. As a team member, I want overdue tasks to appear at the top of my task list in a distinct style, so that I never miss something past its deadline.
10. As a team member, I want to see all my Flagged Tasks (tasks with no estimated hours) prominently on my home screen, so that I can update estimates and keep Bandwidth calculations accurate.
11. As a team member, I want to see all open Action Items assigned to me on my home screen, so that I don't lose track of ad-hoc project to-dos.
12. As a team member, I want to see the Active Projects I'm assigned to on my home screen, so that I can quickly navigate to a project I'm working on.
13. As a team member, I want my home screen to be the first thing I see after login, so that I get oriented immediately without clicking around.

### Bandwidth Calculation

14. As a team member, I want my Bandwidth to be calculated using only Qualifying Tasks (Open, In Progress, In Internal Review, In Client Review), so that closed work doesn't inflate my load.
15. As a team member, I want Bandwidth to use Remaining Hours (estimated minus logged) rather than estimated hours alone, so that progress I've already made is reflected.
16. As a team member, I want to filter Bandwidth by Time Window — Weekly, Monthly, or Total — so that I can see my load across different planning horizons.
17. As a team member, I want tasks with no estimated hours to be excluded from Bandwidth and shown as Flagged Tasks instead, so that missing data doesn't distort the calculation.
18. As a team lead, I want to see each team member's Bandwidth on the Team Bandwidth grid, so that I can identify who is overloaded and who has capacity.
19. As a team lead, I want the Bandwidth grid to use color coding (green <70%, yellow 70–90%, red >90%), so that overload is visible at a glance without reading numbers.
20. As a team lead, I want to switch the Bandwidth grid between Weekly, Monthly, and Total Time Windows, so that I can plan for both immediate and upcoming capacity.

### Project Overview

21. As a team member, I want to see all Active Projects in a scannable overview page, so that I can review the state of every project quickly during our weekly meeting.
22. As a team member, I want each project card to show its Project Status badge (On Track / At Risk / Blocked), so that I can spot problems without opening each project.
23. As a team member, I want the Project Status to auto-calculate based on budget burn rate and overdue tasks, so that the team doesn't have to manually keep it up to date.
24. As a team member, I want to manually override a project's Project Status, so that I can account for context the system cannot detect (e.g. client paused the project).
25. As a team member, I want to mark a project as Blocked manually, so that the team knows there is an external blocker.
26. As a team member, I want to see the latest Weekly Status Update per project on the overview card, so that I get a summary of recent progress without opening the project.
27. As a team member, I want to see budget hours at a glance (used vs. estimated) on each project card, so that I can track financial health across all projects simultaneously.
28. As a team member, I want to see the next milestone and its due date on each project card, so that upcoming deadlines are visible during review.
29. As a team member, I want to see the team members assigned to a project this week on the overview card, so that I know who owns what.

### Weekly Status Updates

30. As a team member, I want to add a Weekly Status Update to any Active Project, so that I can record progress and plans for the team to see.
31. As a team member, I want each Weekly Status Update to include a status (On Track / At Risk / Blocked), a free-text summary, and a timestamp showing who wrote it and when, so that the update is attributable and contextual.
32. As a team member, I want multiple team members to be able to add Weekly Status Updates in the same week, so that different perspectives on a project are captured.
33. As a team member, I want to see the last 4–6 Weekly Status Updates as a feed on the individual project page, so that I can review recent history without leaving the dashboard.
34. As a team member, I want Weekly Status Updates to replace our Google Doc, so that I no longer have to update two separate systems each week.

### Action Items

35. As a team member, I want to create an Action Item tied to a Project or Task, so that I can capture ad-hoc to-dos that aren't formal Intervals tasks.
36. As a team member, I want to assign an Action Item to a specific team member, so that accountability is clear.
37. As a team member, I want to set an optional due date on an Action Item, so that urgent items have a deadline.
38. As a team member, I want incomplete Action Items to carry over to the following week automatically, so that nothing is silently dropped.
39. As a team member, I want carried-over or overdue Action Items to appear visually distinct, so that they stand out during our weekly review.
40. As a team member, I want to mark an Action Item as complete, so that it is removed from the active view and the assignee's bandwidth context.
41. As a team member, I want to see all open Action Items assigned to me under My Work, so that I have one place for my outstanding to-dos.
42. As a team member, I want to see Action Items listed on the individual project page, so that project-level to-dos are visible in context.

### Individual Project Page

43. As a team member, I want to see a project's budget summary (estimated hours, logged hours, spend) on its detail page, so that I have full financial context.
44. As a team member, I want to see all tasks on a project grouped by assignee, so that I can see who is responsible for what.
45. As a team member, I want to see estimated vs. logged hours per task, so that I can identify where a project is running over.
46. As a team member, I want to see Flagged Tasks (no estimates) highlighted on the project page, so that missing estimates are visible in project context.
47. As a team member, I want to see all milestones for a project with their due dates and completion status, so that I can track delivery checkpoints.
48. As a team member, I want to see documents synced from Intervals on the project page, so that project assets are accessible without leaving the dashboard.
49. As a team member, I want to see each assigned team member's Bandwidth on the project page, so that I know who has capacity for additional work on this project.

### Timeline & Calendar View

50. As a team lead, I want a weekly calendar view showing tasks and milestones by due date, so that I can see what is due across the team this week.
51. As a team lead, I want a monthly calendar view showing projects and deadlines, so that I can plan ahead and set client expectations.
52. As a team lead, I want tasks color-coded by status (on track / at risk / overdue) on the timeline, so that problems are visible at a glance.

### Project Archive

53. As a team member, I want closed projects to move off the Project Overview page automatically when their status changes in Intervals, so that the overview stays focused on active work.
54. As a team member, I want to access a Project Archive view showing all Closed Projects, so that I can reference past project history.
55. As a team member, I want all Weekly Status Updates, Action Items, and notes from a closed project to be preserved in the archive, so that historical context is never lost.
56. As a team member, I want archived project data to be read-only, so that closed project records remain stable.

### Email Notifications

57. As a team member, I want to receive a Monday morning email summarizing my tasks for the week and my Bandwidth %, so that I start each week oriented without logging in first.
58. As a team member, I want to receive an email when a task assigned to me becomes overdue, so that I am alerted proactively.
59. As a team member, I want to receive an email when a task assigned to me is due tomorrow, so that I can prepare.
60. As a team lead, I want to receive an email when a project's budget exceeds 80% burned, so that I can manage client expectations before it's too late.
61. As a team member, I want to receive an email when a task assigned to me is Flagged (no estimated hours), so that I know to update the estimate in Intervals.

### Intervals Sync

62. As a team member, I want the dashboard to stay within 15–30 minutes of Intervals data, so that my tasks and logged hours are reasonably current.
63. As a team member, I want the dashboard to remain usable if Intervals experiences downtime, so that a third-party outage doesn't block our team.
64. As a team member, I want my Intervals-sourced data (tasks, projects, time entries, milestones, documents) to appear without me doing anything, so that there is no manual import step.

### Settings

65. As a team member, I want to invite a new team member by email from the Settings page, so that onboarding requires no technical steps.
66. As a team member, I want to see which dashboard users are linked to which Intervals person, so that I can verify mappings are correct.
67. As a team member, I want to manually reassign a dashboard user's Intervals mapping, so that I can fix any auto-match failures.

## Implementation Decisions

### Stack
- **Framework:** Next.js (TypeScript) with App Router
- **Styling:** Tailwind CSS, desktop-first
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Auth:** NextAuth.js (credentials provider, invite-only — no public signup)
- **Hosting:** Vercel (app + Cron jobs)
- **Email:** Resend (free tier, ~5 triggers)

### Modules

**Intervals Sync Engine**
Vercel Cron job firing every 15–30 minutes. Single `syncAll()` entry point that fetches projects, tasks, time entries, people, milestones, worktypes, task notes, project notes, and documents from the Intervals REST API using a single admin credential (ADR-0001). Upserts into Supabase. Handles rate limits (100 req/min, 6,000/day) and partial failures gracefully (ADR-0002).

**Bandwidth Calculator**
Pure function module. Accepts a list of Qualifying Tasks (with estimated hours, logged hours, status, due date) and a Time Window. Returns: Bandwidth %, Available Bandwidth %, and a Flagged Tasks list. No database dependencies — fully deterministic and testable in isolation.

**Project Status Calculator**
Pure function module. Accepts project budget data (estimated hours, logged hours, start date, due date) and a list of tasks with their due dates. Returns On Track or At Risk per defined rules. Blocked status is excluded — always set manually.

**User–Intervals Mapping**
Service that links dashboard User records to Intervals person records. On user creation, attempts auto-match by email. Exposes a manual override interface in Settings. Mapping is stored in the dashboard DB.

**Action Items Service**
CRUD service for Action Items. Handles: creation tied to a Project or Task, assignment to a team member, optional due date, completion toggling, and carry-over detection (items incomplete at end of week remain open and are marked as carried-over). Stored in the dashboard DB (ADR-0003).

**Weekly Status Updates Service**
CRUD service for Weekly Status Updates per Active Project. Handles creation, retrieval (last N entries per project), and timestamps. Stored in the dashboard DB (ADR-0003).

**Email Notification Service**
Resend integration. Five notification types: Monday digest, task overdue, task due tomorrow, project budget >80%, Flagged Task alert. Triggered by the Vercel Cron job and on sync events.

**Page Aggregators**
Server-side data assembly functions for: Personal Home (bandwidth, tasks, flagged tasks, action items, active projects for logged-in user), Project Overview (all active projects with status, latest update, budget, team), Team Bandwidth grid (all users × time windows).

### Schema (key tables)
- `users` — dashboard accounts (NextAuth)
- `intervals_people` — synced from Intervals
- `user_intervals_mapping` — links users to intervals_people
- `intervals_projects` — synced from Intervals
- `intervals_tasks` — synced from Intervals
- `intervals_time_entries` — synced from Intervals
- `intervals_milestones` — synced from Intervals
- `intervals_documents` — synced from Intervals
- `project_status_overrides` — manual Project Status overrides per project
- `weekly_status_updates` — dashboard-only, per project
- `action_items` — dashboard-only, tied to project or task
- `sync_log` — last sync timestamp and status per resource type

### Intervals API
- Base URL: `https://api.myintervals.com/`
- Auth: HTTP Authorization header with admin credential (stored in Vercel env vars)
- Rate limit: 100 req/min, 6,000 req/day — sync job must stay within this
- Response format: JSON

### Bandwidth Formula
`Bandwidth % = (Σ Remaining Hours for Qualifying Tasks) ÷ 40 × 100`
`Remaining Hours = estimated_hours - logged_hours`
Qualifying statuses: Open, In Progress, In Internal Review, In Client Review
Closed tasks: excluded. Tasks with no estimated hours: excluded + flagged.

### Project Status Rules
- **On Track:** burn rate proportional to time elapsed AND no tasks overdue >3 days
- **At Risk:** budget >80% burned with work remaining, OR 1+ tasks overdue >3 days
- **Blocked:** manual only — set and cleared by a team member

## Testing Decisions

**What makes a good test:** Tests should verify observable external behavior — inputs and outputs — not internal implementation. A test should remain valid if the internals are refactored. Avoid testing private methods, internal state, or implementation order.

**Modules with tests:**

- **Bandwidth Calculator** — unit tests. Pure function: given a list of tasks with hours and statuses, assert correct Bandwidth %, Available Bandwidth %, and Flagged Tasks list. Cover: all tasks qualifying, mix of flagged and qualifying, all flagged, logged hours exceeding estimated, each Time Window filter, zero tasks.

- **Project Status Calculator** — unit tests. Pure function: given budget data and task due dates, assert correct On Track / At Risk output. Cover: on-time burn rate, over-budget, tasks overdue exactly 3 days (boundary), tasks overdue >3 days, no tasks, Blocked not returned (manual only).

- **Intervals Sync Engine** — integration tests against a mock Intervals API server. Assert that all resource types are upserted correctly, partial failures don't corrupt existing data, rate limit responses are handled without crashing, and `sync_log` is updated on completion.

- **Action Items Service** — unit tests. Assert: creation with and without due date, completion toggling, carry-over detection (item open past end of week is marked carried-over), overdue detection (past optional due date).

- **Weekly Status Updates Service** — unit tests. Assert: creation stores author and timestamp, retrieval returns last N entries ordered by date, multiple entries in the same week are all returned.

- **User–Intervals Mapping** — unit tests. Assert: auto-match succeeds when emails match, auto-match skips when no email match, manual override persists and takes precedence over auto-match.

- **Email Notification Service** — unit tests with mocked Resend client. Assert: each trigger produces the correct recipient, subject, and content shape. Do not test Resend delivery.

- **Page Aggregators** — integration tests against a seeded test database. Assert: Personal Home returns only data for the logged-in user, Team Bandwidth grid includes all users, Project Overview excludes Closed Projects.

## Out of Scope

- Real-time chat or messaging (team uses Google Chat externally)
- Writing data back to Intervals (tasks, notes, time entries are read-only in the dashboard)
- Mobile-optimized UI (desktop-first; responsive but not mobile-native)
- Per-user Intervals credentials (single admin credential only — ADR-0001)
- Role-based access control (all team members have full access)
- Public signup (invite-only)
- Slack or Google Chat integration
- Creating or editing Intervals tasks from the dashboard
- Two-way sync of Weekly Status Updates or Action Items to Intervals (ADR-0003)

## Further Notes

- **Build phases:** Phase 1 (auth + sync + Personal Home + Bandwidth), Phase 2 (Project Overview + individual project pages + Team Bandwidth grid + User–Intervals mapping), Phase 3 (Timeline/Calendar + email notifications + Monthly/Total Bandwidth filters + milestones/documents).
- **Data freshness:** Dashboard data is at most 15–30 minutes behind Intervals. This is acceptable for project management use — the dashboard is not a real-time tool.
- **Intervals read-only:** The dashboard never writes to Intervals. Intervals remains the source of truth for tasks, time, and project state. The dashboard is the source of truth for Weekly Status Updates and Action Items.
- **Free infrastructure:** All chosen services (Vercel, Supabase, Resend, Prisma, NextAuth) operate within free tiers for a small internal team with daily usage.
