# pandaplan – Claude Code guidance

## Project

pandaplan is a lightweight, self-hosted event planning and attendance application.
It consists of a Node.js/Express backend, a browser-based frontend in `public/`, and
JSON-file persistence in `data/db.json`.

## Development principles

- Read the existing implementation before making changes.
- Keep changes focused on the requested requirement.
- Preserve backwards compatibility with existing `data/db.json` data whenever possible.
- Keep API validation on the server; frontend validation is not a substitute.
- When changing an API response or request shape, inspect all frontend callers and update them consistently.
- Avoid introducing a database or framework unless the requirement genuinely needs it.
- Do not commit secrets, credentials, local configuration, or generated runtime data.
- Keep Docker deployment working.
- Test or syntax-check changed JavaScript where practical.

## Architecture notes

- `server.js` contains the Express server, REST API, persistence helpers, and calendar export logic.
- `public/` contains the user-facing frontend.
- Runtime data belongs in `data/`; it should not be committed.
- The default HTTP port is `3000`.
- Docker Compose persists `./data` and can connect pandaplan to an external `swag_network` reverse-proxy network.

## Calendar behaviour

The application generates iCalendar output. Keep generated calendars valid and compatible with
Google Calendar, Apple Calendar, and Outlook. Preserve escaping and RFC 5545 line folding when
changing ICS generation.

## Roles

The current role vocabulary includes `participant`, `scorekeeper`, and `referee`. People may have
multiple roles, and event categories can specify required staff roles. Do not silently remove this
behaviour when modifying people or event logic.

## Working from requirements

When a user supplies a new requirement:

1. Inspect the relevant code paths and existing behaviour.
2. Identify all affected backend, frontend, data, and deployment pieces.
3. Implement the complete change.
4. Check for regressions and backwards compatibility.
5. Run available validation/tests.
6. Summarize what changed and any limitations.
