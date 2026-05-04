# ADR 0001: Single Intervals Admin Credential

## Status
Accepted

## Context
The Intervals API authenticates per-user — each request is made on behalf of a specific Intervals account. The dashboard needs to pull data for all team members (tasks, time entries, projects, bandwidth) to power team-wide views.

Two options were considered:
- Per-user credentials: each team member links their own Intervals account to the dashboard
- Single admin credential: one Intervals owner account is used for all API calls server-side

## Decision
Use a single Intervals admin credential stored in Vercel environment variables. All Intervals API calls are made server-side using this credential.

## Consequences
- Team members never manage Intervals credentials in the dashboard — invisible to them
- All team data is always available from day one, including bandwidth calculations
- Dashboard has its own separate auth system (NextAuth) — Intervals credentials are purely a backend secret
- If the admin credential changes, one env var update fixes it
- Trade-off: all data visible to the dashboard reflects what the admin account can see in Intervals — if the admin lacks access to something, it won't appear
