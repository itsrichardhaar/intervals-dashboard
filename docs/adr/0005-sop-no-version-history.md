# SOPs do not have version history

SOPs track `createdAt`, `createdBy`, `updatedAt`, and `updatedBy` but do not snapshot previous versions. Each save overwrites the current content. We considered full version history (every save creates a restorable snapshot) and light versioning (manual version stamps like v1, v2), and rejected both. SOPs in this system are team-maintained living documents — the overhead of version management outweighs the benefit at this team size, and the state machine (Draft → Published → Archived, with restore back to Draft) provides enough of a safety net against accidental changes.

Add versioning only if a real audit or rollback need emerges.
