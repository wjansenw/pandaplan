# PandaPlan — Product Requirements

## 1. Purpose

PandaPlan is a self-hosted web application for clubs, sports teams and similar groups that need a simple way to manage teams, people, events, attendance and staff assignments.

The application should make routine team administration fast and safe, while remaining simple enough for participants to use without training.

The requirements below describe the product independently of the current implementation. A new implementation should be able to use this document as its functional specification.

## 2. Core concepts

### 2.1 Account

An account represents a person authenticated through an external identity provider. Authentication identifies the user; application authorization determines what that user may do.

An account may have access to multiple teams and may have a different application role in each team.

### 2.2 Team

A team is an independent operational unit. Examples include an age group, squad, committee or other club group.

A team has:

- Name
- Unique URL-safe slug
- Optional description
- Members
- Events
- Categories
- Staff assignments

There must be no implicit or special “default team” after teams have been created. Team context must always be explicit.

### 2.3 Person

A person is an individual belonging to one or more teams.

A person can have multiple functional roles within a team, such as participant, coach, assistant coach, trainer, scorekeeper or referee.

Functional person roles describe what the person does in the team. They are distinct from account/application roles, which control access to PandaPlan.

### 2.4 Event

An event belongs to exactly one team and may have:

- Date
- Start time
- End time
- Category
- Location
- Description
- Participant attendance
- Staff assignments

The location should be presented as a clickable map link when supplied.

### 2.5 Category

A category is a team-specific classification of events. It has a name and display color and may define the staff roles applicable to events in that category.

### 2.6 Attendance

Attendance is recorded per person and event.

Supported states:

- Going
- Maybe
- Not going
- Unknown / no response

An attendance record may contain an optional note.

## 3. Authentication

### 3.1 Identity provider

The application should support OpenID Connect (OIDC) authentication.

The preferred flow is Authorization Code with PKCE (S256), with state and nonce validation.

The application must not handle or store the user's identity-provider password.

### 3.2 Account identity

An authenticated account must be identified by the identity provider and stable provider subject, not by email address alone.

Email, display name and other profile information may be synchronized from the identity provider but must not be the primary identity key.

### 3.3 Sessions

After successful authentication, the application creates a secure server-side session.

Session cookies must be:

- HttpOnly
- Secure in production
- SameSite=Lax or stricter where compatible with the authentication flow
- Given a finite lifetime

Production deployments must use a persistent/shared session store rather than the Express in-memory session store.

### 3.4 Logout

The user must be able to end the local application session. The application should also support identity-provider logout when the configured provider supports it.

### 3.5 Authentication failure

Unauthenticated API requests must return an appropriate HTTP 401 response. Browser pages requiring authentication should redirect to the login flow.

Authorization failures must return HTTP 403 and must not reveal information about resources the user is not permitted to access.

## 4. Authorization and roles

Authorization must be enforced by the backend. Hiding UI controls is not a security boundary.

### 4.1 Site administrator

A site administrator has global access to the application, including:

- Create, edit and delete teams
- Manage accounts and application roles
- Manage all team data
- Access all teams regardless of membership

The system must prevent removal or demotion of the final site administrator if that would leave the installation without an administrator.

### 4.2 Team manager

A team manager has management access within explicitly assigned teams:

- View team information
- Manage people and team membership
- Manage person/team roles
- Create and manage events
- Manage categories
- Manage attendance for team members
- Manage staff assignments
- Access team calendar feeds

A team manager must not automatically receive access to another team.

### 4.3 Staff coordinator

A staff coordinator has team-scoped access to:

- View team information
- View relevant events and people
- Manage staff assignments

They must not automatically receive permission to manage people, categories or attendance.

### 4.4 Team member

A team member has team-scoped access to:

- View their team
- View events relevant to them
- View appropriate team information
- Manage their own attendance

A normal team member must not be able to modify another person's attendance.

### 4.5 Ownership-sensitive permissions

Permissions must distinguish between operations on the user's own data and management operations on other users' data.

For example:

- `attendance:self` — change the authenticated user's own attendance
- `attendance:manage` — change attendance for any person in an authorized team

A generic `attendance:manage` permission must not be granted to ordinary team members merely because they are allowed to record their own attendance.

### 4.6 Authorization evaluation

Authorization must evaluate current server-side role/membership information. Application roles stored in a login session must not become a stale security decision after an administrator changes a user's permissions.

At minimum, sensitive authorization decisions must use current account/team membership data or a deliberately short-lived, invalidatable authorization cache.

### 4.7 Team isolation

Every team-scoped API operation must verify both:

1. The authenticated account has the required permission.
2. The requested resource belongs to the team for which that permission is held.

IDs or URLs from another team must never allow cross-team access.

## 5. Team management

Site administrators can:

- Create teams
- Rename teams
- Change descriptions
- Change slugs subject to uniqueness rules
- Delete teams

Deleting a team must safely remove or detach its team-scoped data according to defined database cascade rules.

Team URLs should use the team slug, for example `/team/u13`.

There should not be a redundant standalone team page that contains little useful information. The team landing page should be the team overview.

## 6. People management

Authorized team managers can:

- Add people to a team
- Remove people from a team
- Edit person information
- Assign one or more functional roles
- View attendance and event participation

A person may belong to multiple teams. Team membership and team-specific roles must therefore be modeled independently from the global person record.

Removing a person from a team must remove or invalidate team-specific assignments that can no longer be valid.

## 7. Events

Authorized users can create and manage team events.

An event must support:

- Date
- Optional start time
- Optional end time
- Category
- Optional location
- Optional description

Events must be displayed chronologically.

The UI must make the event date, time and location immediately understandable.

Locations should be clickable and open a suitable map service rather than being plain text.

## 8. Attendance

### 8.1 Individual attendance

A participant can change their own attendance for an event.

Authorized managers can change attendance for participants in their team.

Attendance changes must be persisted through the API.

### 8.2 Safe editing UX

Attendance browsing should be read-only by default.

Editing must require an explicit action/mode so that simply scrolling or browsing events cannot accidentally change attendance.

### 8.3 Bulk attendance

Authorized users can select a participant and apply an attendance state to multiple applicable events.

The user must be able to filter the event set by relevant criteria such as:

- Date range
- Event category
- Event selection

The same selected event set must be used consistently by the bulk-edit workflow.

Applying an attendance state across many events is a consequential operation and should require explicit confirmation before submission.

## 9. Staff assignments

Authorized users can assign staff members to events using the staff roles configured for the relevant category/team.

A person may have at most one staff role for a particular event.

The rule must be enforced by the backend/database, not only by frontend validation.

A person cannot be assigned a staff role that they do not hold in the relevant team.

Removing a person's applicable team role must not leave an invalid staff assignment behind.

## 10. Categories

Authorized team managers can:

- Create categories
- Rename categories
- Set display color
- Configure applicable staff roles
- Remove categories

Removing a category must not unexpectedly destroy historical event data. Events should either retain a valid nullable category reference or be handled according to an explicit deletion policy.

## 11. Calendar feeds

The application must provide iCalendar (`.ics`) feeds for:

- Teams
- Individual people

Example URL patterns:

```text
/calendar/team/<team>.ics
/calendar/person/<person>.ics
```

Calendar feed URLs are credentials/secrets if they contain an unguessable access token. They must therefore be treated as private links.

The UI must display calendar feed URLs as copyable text/links. It must not present the URL as a button whose primary behavior is to download the ICS file.

Events imported or generated for calendars must preserve the intended timezone semantics.

## 12. Main user experience

The application should prioritize a single useful team workspace rather than forcing administrators through many separate pages.

The team overview should provide, or provide direct access to:

- Upcoming events
- Attendance overview
- People/participants
- Staff assignments
- Relevant event information
- Calendar feed URL

Management controls may be enabled explicitly when needed rather than making every view editable.

For example:

- Attendance is normally read-only.
- An explicit attendance edit mode enables changes.
- Staff editing can be enabled explicitly.
- Bulk actions require deliberate selection and confirmation.

This is intended to minimize accidental attendance changes on mobile devices.

## 13. Navigation

Desktop layouts should provide persistent navigation.

Mobile layouts should provide a compact navigation drawer/menu.

The navigation should be team-context aware.

When a user is viewing a team, the team navigation should expose the functions they are actually authorized to use.

The overview should be the primary team landing page. Separate pages should exist only when they provide substantial additional functionality.

## 14. Internationalization

The UI must support:

- English
- Dutch (Belgian)

All user-facing strings must use a shared translation mechanism.

The translation system should support translated placeholders and correctly set the document language.

Adding a new user-facing string requires translations in both supported languages.

## 15. Responsive design

The application must work on:

- Desktop browsers
- Tablets
- Mobile phones

Mobile use is especially important for attendance management. Controls must be large enough to use reliably and must not make accidental state changes likely during scrolling.

## 16. API

The frontend must communicate with the backend through a documented REST-style HTTP API.

The API is authoritative for all persistent operations, including:

- Teams
- People
- Team memberships
- Functional roles
- Events
- Categories
- Attendance
- Staff assignments
- Application authorization

The frontend must never bypass authorization or persistence rules by directly manipulating the database.

Every mutating API endpoint must enforce authorization on the server.

API responses should use appropriate HTTP status codes and consistent JSON error structures.

## 17. Data model requirements

The persistent data model must represent at least:

- Accounts
- Application/team authorization roles
- Persons
- Teams
- Team memberships
- Team-specific functional roles
- Categories
- Category staff roles
- Events
- Attendance
- Staff assignments

Important integrity rules should be enforced in the database wherever practical, including:

- Unique team slugs
- Unique team/person membership
- Unique person/event attendance
- Valid attendance states
- Maximum one staff role per person/event
- Staff role must belong to the person's team roles
- Referential integrity and appropriate cascading behavior

## 18. Persistence and deployment

The application should be self-hostable with minimal operational complexity.

A reference deployment should support Docker Compose.

SQLite is suitable for the initial deployment model and should be stored on persistent storage.

Database schema changes must use numbered migrations. Existing migrations must not be edited after being applied; fixes and changes must be introduced through new migrations.

Configuration should be provided through environment variables, including at minimum:

- `PORT`
- `DATA_DIR`
- Event/calendar timezone configuration
- OIDC configuration
- Session configuration/secrets

## 19. Security requirements

The application must:

- Require authentication for protected resources.
- Enforce authorization server-side.
- Prevent cross-team data access.
- Validate OIDC state and nonce.
- Use PKCE for OIDC authorization-code flows.
- Use secure session cookies in production.
- Protect session secrets and encryption keys through environment/configuration management.
- Validate all user-controlled IDs, slugs and input fields.
- Use parameterized database queries.
- Avoid exposing stack traces or sensitive internal information to users.
- Treat calendar feed URLs as private credentials where applicable.
- Log security-relevant failures without logging passwords, tokens or other secrets.

## 20. Non-functional requirements

The application should be:

- Simple to deploy
- Fast for normal team sizes
- Understandable to maintain
- Usable without a frontend framework
- Usable on mobile
- Resilient to container restarts
- Safe against accidental data modification
- Explicit about authorization boundaries

The initial architecture should favor straightforward code over unnecessary abstraction. Shared infrastructure should be introduced where it genuinely prevents duplication or inconsistency.

## 21. Suggested reference architecture

A similar implementation can use:

- **Backend:** Node.js + Express
- **Database:** SQLite
- **Database driver:** better-sqlite3 or equivalent synchronous SQLite driver
- **Frontend:** HTML/CSS/vanilla JavaScript
- **Authentication:** OIDC Authorization Code + PKCE
- **Sessions:** server-side sessions with a production-capable persistent store
- **Calendar:** iCalendar generation
- **Deployment:** Docker Compose

The frontend should remain independent of the persistence layer. All business rules that affect security or data integrity belong in the backend/database.

## 22. Acceptance criteria

A new implementation is functionally complete when all of the following are true:

1. A new installation can authenticate through OIDC.
2. The first configured administrator can create and manage teams.
3. A team manager can manage only the teams to which they are assigned.
4. A team member cannot access or modify another team's data.
5. A team member can change their own attendance but cannot manage another participant's attendance.
6. A team manager can manage attendance for participants in their authorized team.
7. People can belong to multiple teams with independent team roles.
8. Events can be created, edited and displayed with date/time/category/location.
9. Event locations are clickable map links.
10. Staff can be assigned to events using valid team staff roles.
11. The system prevents more than one staff role for the same person/event.
12. Team and person calendar feeds are available and their URLs can be copied.
13. Attendance browsing does not accidentally modify data; editing requires explicit intent.
14. Bulk attendance changes require explicit selection and confirmation.
15. English and Belgian Dutch are supported throughout the UI.
16. The UI works on desktop and mobile.
17. Authorization changes take effect without relying indefinitely on stale login-session role data.
18. Database integrity rules prevent invalid cross-team or orphaned relationships.
19. Container restart does not lose persistent application data or unexpectedly invalidate all sessions in a production deployment.
20. No functionality depends on a special/default team once real teams exist.

## 23. Product principle

PandaPlan should optimize for **simple, safe team administration**.

The application should make the common operations obvious:

> See what is happening → see who is involved → update attendance or staff when explicitly requested → move on.

Complexity should be kept out of the normal user workflow, while the backend remains strict about identity, authorization, team isolation and data integrity.
