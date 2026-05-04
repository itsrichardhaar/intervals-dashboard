# ADR 0002: Scheduled Sync to Own Database

## Status
Accepted

## Context
The Intervals API has a rate limit of 6,000 requests/day. The dashboard needs to serve multiple team members querying tasks, projects, time entries, and people simultaneously.

Two options were considered:
- Live API calls: fetch from Intervals on each page load, cache for 10–15 minutes
- Scheduled sync: a background job syncs Intervals data into Supabase every 15–30 minutes; dashboard reads from its own DB

## Decision
Sync Intervals data into the dashboard's own Supabase database every 15–30 minutes via a Vercel Cron job. The dashboard reads exclusively from its own DB, never calling Intervals directly at request time.

## Consequences
- Dashboard is fast — all queries hit local Postgres, not a third-party API
- Rate limit risk eliminated — only the sync job calls Intervals, not individual user requests
- Dashboard remains functional if Intervals has downtime
- Data is at most 15–30 minutes stale — acceptable for project management use (not a real-time tool)
- Sync job must handle partial failures gracefully (Intervals down, rate limit hit mid-sync)
