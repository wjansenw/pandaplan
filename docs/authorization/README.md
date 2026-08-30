# Authorization foundation

PandaPlan authorization is account-based and deliberately separate from Person records.

Global role:
- `site_admin`: unrestricted access across all teams.

Team roles:
- `team_member`: view team data and manage attendance and staff assignments (`roster:manage`).
- `team_manager`: full management of the assigned team (people, events, categories, plus everything `team_member` can do).

An account can have different team roles for different teams.

These roles are enforced on every team-scoped API route (see `server.js` and `src/auth/middleware.js`). Role assignment is managed from the `/oidc/users` admin page.
