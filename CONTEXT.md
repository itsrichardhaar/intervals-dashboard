# Project Dashboard — Domain Context

## Glossary

### Active Project
A project whose status in Intervals is not "Closed" or "Completed". Intervals is the source of truth for project state. Active Projects appear on the Project Overview page.

### Bandwidth
A percentage representing how much of a team member's 40-hour work week is already committed to Qualifying Tasks. Calculated as `(sum of Remaining Hours across Qualifying Tasks) ÷ 40 × 100`.

### Available Bandwidth
The inverse of Bandwidth: `100% - Bandwidth`. Represents how much capacity a team member has left in their work week.

### Remaining Hours
The hours still owed on a task: `estimated hours - logged hours`. Used as the input to Bandwidth calculation.

### Qualifying Task
A task assigned to a person with status Open, In Progress, In Internal Review, or In Client Review. Filtered by the active time window (Weekly, Monthly, or Total). Tasks with no estimated hours are excluded and Flagged instead.

### Flagged Task
A task assigned to a team member that has no estimated hours set. Excluded from Bandwidth calculation. Surfaced prominently on the personal home screen as requiring action.

### Time Window
The date range filter applied to Qualifying Tasks for Bandwidth calculation. Three values: Weekly (due this week), Monthly (due this month), Total (all assigned open tasks regardless of due date).

### Weekly Status Update
A brief team-visible note written per Active Project during weekly review. Includes: a Status badge (On Track / At Risk / Blocked), a free-text summary, and a record of who wrote it and when. Multiple team members can add their own entries in the same week. Stored in the dashboard only — not synced back to Intervals. Displayed as a feed showing the last 4–6 entries on the Project Overview page.

### Action Item
A lightweight assignable to-do tied to a Project or Task, living outside of Intervals tasks. Created ad-hoc during project review. Has an assignee (team member), an optional due date, and a completion status. Carries over week to week until explicitly marked complete. Overdue or carried-over Action Items are visually distinct during weekly review.

### Navigation Structure
```
Home                    ← Personal Home (default)
Projects
  ├── Overview          ← all Active Projects / weekly review
  ├── Archive           ← Closed Projects, read-only
  └── [Project pages]   ← individual project deep-dive
Team
  ├── Bandwidth         ← team grid, color-coded %
  └── Timeline          ← weekly / monthly calendar view
My Work
  ├── All My Tasks      ← full task list, grouped by project, sorted by due date
  └── My Action Items   ← all open Action Items assigned to me
Settings
  └── Users             ← invite users, manage Intervals mapping
```

### Personal Home
The default landing screen after login. Shows a personal summary for the logged-in team member: bandwidth %, tasks due this week, Flagged Tasks, carried-over Action Items, and active projects they are assigned to. Not a team-wide view. Tasks sorted by due date — due date is the primary priority signal. Overdue tasks surface at the top.

### Project Archive
A read-only view of Closed Projects (status = Closed or Completed in Intervals). Preserves all dashboard-only data attached to the project: Weekly Status Updates, Action Items, and notes. Accessible from the Projects navigation. Closed projects are removed from the active Project Overview page and moved here automatically when their Intervals status changes.

### Project Status
An auto-calculated badge per Active Project with three values and the following rules:
- **On Track** — budget burn rate is proportional to time elapsed AND no overdue tasks
- **At Risk** — budget >80% burned with work remaining, OR 1+ tasks overdue by more than 3 days. Auto-calculated.
- **Blocked** — always set manually by a team member. Cannot be auto-calculated. Represents external blockers (client, vendor, dependency) the system cannot detect.
Team members can manually override On Track / At Risk. Blocked can only be set and cleared manually.
