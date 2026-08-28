# Authorization foundation

PandaPlan authorization is account-based and deliberately separate from Person records.

Global role:
- `site_admin`: unrestricted access across all teams.

Team roles:
- `team_member`: view team data and manage participant attendance.
- `staff_coordinator`: view team data and manage staff assignments.
- `team_manager`: full management of the assigned team.

An account can have different team roles for different teams.

This foundation is not yet wired into existing API routes or UI. Role assignment and administrative management of accounts are intentionally left for a later step.
