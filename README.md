# pandaplan

A lightweight, self-hosted event planning and attendance roster application.

pandaplan is designed for groups that need a simple way to manage people, event categories, events, attendance, and staff assignments without relying on a hosted third-party service.

## Features

- **People management** – maintain participants and staff in one place.
- **Multiple roles** – a person can be a participant and/or hold staff roles such as coach, assistant coach, trainer, scorekeeper, or referee.
- **Event categories** – organise events and define the staff roles required for each category.
- **Event management** – create individual events or generate recurring event series by date range, weekdays, times, location, subject, and category.
- **ICS import** – import calendar events and automatically assign categories based on event location, with a fallback category when no location rule matches.
- **Attendance tracking** – record yes/no/maybe attendance and optional notes.
- **Bulk attendance** – in Edit attendance mode, select a participant, filter events by category and date range, and set attendance for all matching events at once.
- **Staff assignments** – assign people with appropriate roles to individual events.
- **Team overview** – view events, attendance, and staff assignments from a single team overview page, with dedicated edit modes for attendance and staff.
- **Calendar subscription** – copy calendar feed URLs for a team or individual person and subscribe to them from a calendar application.
- **Translations** – frontend text is translated through the shared `t()` translation system, with Dutch (`nl-BE`) and English support and locale fallback handling.
- **SQLite persistence** – application data is stored in a transactional SQLite database with foreign-key constraints and schema migrations.
- **Docker support** – ready to run as a Docker container using Docker Compose.
- **Self-hosted** – no external database or SaaS service is required.

## Technology

- Node.js
- Express 4
- better-sqlite3
- HTML/CSS/JavaScript frontend
- SQLite
- Docker / Docker Compose

## Quick start with Docker

Clone the repository and start the application:

```bash
git clone https://github.com/wjansenw/pandaplan.git
cd pandaplan
docker compose up -d --build
```

The application listens on port **3000** by default:

```text
http://localhost:3000
```

The supplied Compose configuration maps port `3000` on the host to port `3000` in the container and persists application data in `./data`. It also connects the container to an existing external Docker network named `swag_network`, which is useful when running pandaplan behind an existing reverse proxy.

If you do not use that network, remove the `networks` section from `docker-compose.yml` and the corresponding service network entry.

## Running without Docker

Install Node.js, then install the dependencies and start the server:

```bash
npm install
npm start
```

The server uses port `3000` by default. The port and data directory can be changed with environment variables:

```bash
PORT=3000 DATA_DIR=./data npm start
```

`server.js` is the application entry point. On startup it opens the SQLite database, applies any pending migrations, and imports legacy JSON data when appropriate.

## Data storage

Application data is stored in the configured data directory, which defaults to `./data`:

The SQLite database is created automatically on first startup. The schema contains separate tables for people, roles, categories, events, attendance, and staff assignments, with foreign-key constraints enforcing relationships between them.

### Backups

**Back up the `data/` directory regularly** if the application contains important event or attendance information. The SQLite database is the authoritative application data store.

## Reverse proxy

pandaplan can be placed behind a reverse proxy such as SWAG, nginx, or another Docker-aware proxy. The default container port is `3000`.

For a reverse-proxy deployment, expose pandaplan only to the proxy network and publish it through your preferred hostname and HTTPS configuration.

The default Docker Compose configuration expects an existing external Docker network named `swag_network`.

## Development

For local development, install dependencies with:

```bash
npm install
```

Then start the server:

```bash
npm start
```

There is currently no separate frontend build step. The frontend is plain HTML/CSS/JavaScript and shared frontend code is kept in the `public/` directory.

When changing the database schema, add a new migration under `src/db/migrations/`. Start the application normally to apply pending migrations automatically.

### Frontend translations

Frontend user-facing strings should use the shared `t()` translation function rather than hard-coded text. Add new translation keys to the shared message dictionaries for all supported languages.

Application state should not be inferred from translated button labels or other rendered text. Use explicit state, element IDs, data attributes, or events instead. This is particularly important for edit-mode controls and bulk attendance.
Frontend user-facing strings should use the shared `t()` translation function rather than hard-coded text. Add new translation keys to the shared message dictionaries for all supported 

## Configuration

The following environment variables are supported:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `DATA_DIR` | `./data` | Directory containing the SQLite database and application data |

## Status

pandaplan is a small personal/self-hosted project and may evolve as new event-management requirements are added. The application focuses on straightforward event planning, attendance management, and staff assignment rather than being a full-featured event-management platform.

