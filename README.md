# pandaplan

A lightweight, self-hosted event planning and attendance roster application.

pandaplan is designed for groups that need a simple way to manage people, event categories, events, attendance, and staff roles without relying on a hosted third-party service.

## Features

- **People management** – maintain a list of participants and staff.
- **Roles** – people can be participants, scorekeepers, referees, or a combination of roles.
- **Event categories** – organise events and define required staff roles per category.
- **Event management** – create events with dates, times, descriptions, and locations.
- **Attendance tracking** – register people for events and keep optional attendance notes.
- **Calendar export** – generate iCalendar (`.ics`) calendars containing event details and attendees.
- **Simple persistence** – application data is stored in a JSON database under `data/`.
- **Docker support** – ready to run as a Docker container using Docker Compose.
- **Self-hosted** – no external database or SaaS service is required.

## Technology

- Node.js
- Express 4
- HTML/CSS/JavaScript frontend
- JSON file storage
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

The supplied Compose configuration maps port `3000` on the host to port `3000` in the container and persists application data in `./data`. It also connects the container to an existing external Docker network named `swag_network`, which is useful when running pandaplan behind an existing reverse proxy. fileciteturn4file0L2-L2

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

The application is an Express server with `server.js` as its entry point and Express as its only runtime dependency. fileciteturn3file0L2-L2

## Data storage

pandaplan stores its data in:

```text
data/db.json
```

The database is created automatically on first startup. It contains the application's people, categories, events, and attendance data.

When using Docker Compose, the `./data` directory is mounted to `/app/data` in the container, so data survives container recreation. fileciteturn4file0L2-L2

**Back up the `data/` directory regularly** if the application contains important event or attendance information.

## Application structure

```text
pandaplan/
├── public/             # Web frontend
├── data/               # Persistent application data (created at runtime)
├── server.js           # Express server and API
├── Dockerfile          # Container image definition
├── docker-compose.yml  # Docker Compose deployment
├── package.json        # Node.js project configuration
└── README.md
```

## API

The backend exposes a JSON API under `/api`. The application state is available through:

```text
GET /api/state
```

The API handles management of people, categories, events, attendance, and calendar exports.

## Reverse proxy

pandaplan can be placed behind a reverse proxy such as SWAG, nginx, or another Docker-aware proxy. The default container port is `3000`.

For a reverse-proxy deployment, expose pandaplan only to the proxy network and publish it through your preferred hostname and HTTPS configuration.

## Development

For local development, install dependencies with:

```bash
npm install
```

Then start the server:

```bash
npm start
```

After making changes, restart the Node.js process. There is currently no separate build step.

## Status

pandaplan is a small personal/self-hosted project and may evolve as new event-management requirements are added. The application currently focuses on straightforward event planning and attendance management rather than being a full-featured event-management platform.

## License

No license has currently been specified for this repository. Unless a license is added, the repository should be treated as **all rights reserved**.
