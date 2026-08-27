# PandaPlan

PandaPlan is a self-hosted event attendance and team management application. It is designed for clubs, teams and other groups that need a simple way to manage people, events, attendance and staff assignments.

## Features

- Manage multiple teams
- Manage people within teams
- Distinguish participants and staff
- Create and manage events
- Track attendance per event
- Add attendance notes
- Assign staff to events and staff roles
- Prevent a person from having multiple staff roles for the same event
- Team and person calendar feeds in iCalendar (`.ics`) format
- Clickable event locations
- Bulk attendance management
- Dutch and English translations
- Responsive interface with a desktop sidebar and mobile navigation drawer
- Optional admin mode for management functions

## Architecture

PandaPlan uses a deliberately simple architecture:

- **Backend:** Node.js with Express
- **Database:** SQLite using `better-sqlite3`
- **Frontend:** Plain HTML, CSS and JavaScript
- **API:** REST-style HTTP endpoints
- **Deployment:** Docker / Docker Compose

There is no frontend framework or frontend build system. The browser loads the HTML, JavaScript and CSS directly from the `public/` directory.

### Backend

The application starts from `server.js`.

Backend responsibilities are separated into:

- API route modules
- Database access
- SQLite schema migrations
- Shared application/state services
- Calendar feed generation

SQLite is the authoritative data store.



## Frontend

The frontend is implemented using standard browser APIs without a JavaScript framework.

The main frontend code lives in:

```text
public/
```

Shared functionality is separated from page-specific code where practical.

Examples of shared functionality include:

- API access
- translations
- team state loading
- navigation
- common rendering helpers
- event/date formatting
- calendar URL handling

Team-specific pages are responsible for their own rendering and interaction logic.

### Navigation

PandaPlan uses a hierarchical sidebar navigation.

At the top level, users can navigate to:

```text
Teams
├── Team
│   └── Overview
└── ...
About
```

When running in admin mode, additional team management pages are available:

```text
Teams
├── Team
│   ├── Overview
│   ├── People
│   └── Events
└── ...
About
```

The sidebar is fixed on desktop and becomes a slide-out navigation drawer on smaller screens.

Admin mode is enabled through the `mode=admin` URL parameter.

## Translations

User-facing frontend text should use the shared translation system rather than hard-coded language-specific strings.

Translations are provided for:

- English
- Dutch (Belgian)

The translation system also updates the document language and supports translated placeholders.

When adding user-facing text:

1. Add a translation key.
2. Add the English translation.
3. Add the Dutch translation.
4. Reference the key through the shared translation function.

Avoid putting user-facing text directly into JavaScript when it should be translated.

## Attendance

Attendance is tracked per participant and event.

The supported attendance states are:

- Going
- Maybe
- Not going
- Unknown

Participants can also have an optional attendance note for an event.

Bulk attendance editing allows an administrator to select a participant and apply an attendance state across the applicable events.

The event/date/category filters are shared with the relevant overview and bulk-edit functionality so that the same event selection is used consistently.

## Staff assignments

Staff can be assigned to events using defined staff roles.

A person can have **at most one staff role for a given event**. This rule is enforced at the database/API level rather than relying only on frontend state.

Staff assignments can be edited from the team overview.

## Calendar feeds

PandaPlan exposes iCalendar feeds for teams and people.

Team calendar:

```text
/calendar/team/<team>.ics
```

Person calendar:

```text
/calendar/person/<person>.ics
```

The frontend displays these URLs so they can be copied into a calendar application.

Calendar URLs are not intended to be presented as file-download buttons.

## Event locations

Events can have a location.

Where a location is provided, it is presented as a clickable link that opens the location using a map service.

## API

The frontend communicates with the backend through HTTP API endpoints.

The API is the authoritative interface for modifying:

- teams
- people
- events
- attendance
- staff assignments
- categories

Frontend code should not bypass the API by directly manipulating persistent data.

## Running with Docker

PandaPlan can be run using Docker Compose.

A typical setup exposes the application through the configured HTTP port and stores persistent application data in the configured data directory.

The database should be kept on persistent storage so that it survives container recreation.

## Configuration

The application supports configuration through environment variables.

Important settings include:

- `PORT` — HTTP port used by the application
- `DATA_DIR` — location for persistent application data and the SQLite database

The default application port can be overridden through `PORT`.

## Development

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm start
```

The application runs directly from the source tree; there is no frontend build step.

For frontend formatting, Prettier can be used to format HTML, JavaScript and CSS files.

## Project structure

The important parts of the repository are structured approximately as follows:

```text
.
├── server.js
├── package.json
├── public/
│   ├── *.html
│   ├── *.js
│   ├── *.css
│   └── ...
└── src/
    ├── db/
    │   └── migrations/
    ├── routes/
    ├── services/
    └── ...
```

The exact file structure may evolve as the application is refactored.

## Data and persistence

PandaPlan uses SQLite as its persistent data store.

The database is created and migrated automatically when the application starts.

Database files should be stored on persistent storage when running PandaPlan in Docker.


## License

PandaPlan is distributed under the license specified in the repository's `LICENSE` file.

See [`LICENSE`](LICENSE) for the complete license text.

## Contributing

When making changes:

- Keep API and frontend responsibilities separated.
- Prefer shared infrastructure when functionality is genuinely common.
- Avoid unnecessary abstractions and over-engineering.
- Keep page-specific rendering and interaction logic together where that makes the code easier to understand.
- Use the existing translation system for user-facing text.
- Use database migrations for persistent schema changes.
- Preserve responsive behavior on both desktop and mobile.
- Keep functional changes separate from pure formatting changes where practical.
