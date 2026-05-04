# ADR 0003: Dashboard-Only Notes and Action Items

## Status
Accepted

## Context
The dashboard introduces two new data types not tracked in Intervals: Weekly Status Updates (replacing a Google Doc project summary) and Action Items (lightweight assignable to-dos tied to projects or tasks).

Two options were considered:
- Write these back to Intervals (project notes API, task notes API)
- Store them only in the dashboard's Supabase database

## Decision
Weekly Status Updates and Action Items are stored exclusively in the dashboard's Supabase database and are never synced back to Intervals.

## Consequences
- Dashboard notes can have richer structure (status badges, assignees, timestamps, carry-over logic) than Intervals' basic note fields allow
- No two-way sync complexity — Intervals remains the source of truth for tasks and time, the dashboard is the source of truth for team communication and weekly review
- If the dashboard is ever decommissioned, this data does not survive in Intervals
- Intervals project notes and task notes pulled in during sync are displayed read-only alongside dashboard notes — they are never modified by the dashboard
