# PandaPlan — Product Requirements

## 1. Purpose

PandaPlan is a self-hosted web application for clubs, sports teams and similar groups to manage teams, people, events, attendance and staff assignments.

The product should make routine team administration fast and safe while remaining simple for participants to use without training. These requirements describe the product independently of its implementation and should be sufficient to build a compatible implementation from scratch.

## 2. Core concepts

### 2.1 User and Person are independent

**User and Person are deliberately separate entities. Neither is a subtype of the other, and neither is required to exist for the other to exist.**

A **User** represents someone who can authenticate to PandaPlan. Authentication, application access and authorization belong to the User.

A **Person** represents an individual in the club/team domain. Team membership, participation, attendance and functional roles belong to the Person.

These rules are fundamental:

- A Person can exist without a User. For example, a child/player can be managed by a parent or team administrator without ever logging in.
- A User can exist without a Person. For example, an administrator can have application access without being a player, coach or other participant.
- A User and Person may optionally be explicitly associated.
- Logging in must never implicitly create a Person.
- Creating a Person must never implicitly create a User.
- Email address, name or other profile data must never implicitly associate or merge a User and Person.
- Deleting a User must not delete its associated Person.
- Deleting a Person must not delete its associated User.
- The User/Person association must be represented explicitly and separately from both entities.

### 2.2 User

A User represents an authenticated application identity. A User may have access to multiple teams and may have different authorization roles in different teams.

A User does not represent team participation. A User may manage a team without being a Person in that team.

OIDC authentication creates or updates a User; it does not create or modify a Person.

### 2.3 Person

A Person is an independent domain entity. A Person may belong to multiple teams and may have different functional roles in each team, such as player, coach, assistant coach, trainer, referee or scorekeeper.

A Person does not need a User to appear in teams, events, attendance records or staff assignments.

### 2.4 Team

A Team is an independent operational unit with a name, unique URL-safe slug, optional description, People, Events, Categories and Staff assignments.

Team context must always be explicit. There must be no implicit or special “default team” once real teams exist.

### 2.5 Event

An Event belongs to exactly one Team and supports date, optional start/end time, category, optional location, description, attendance and staff assignments.

Locations should be clickable map links.

### 2.6 Attendance

Attendance belongs to a Person and Event, never directly to a User. Supported states are Going, Maybe, Not going and Unknown/no response, with an optional note.

When a User is associated with a Person, that User may be authorized to manage that Person's own attendance. This does not make User and Person the same entity.

## 3. Authentication

The application must support OpenID Connect (OIDC), preferably Authorization Code + PKCE (S256), with state and nonce validation. PandaPlan must not handle or store identity-provider passwords.

A User must be identified using the identity provider and stable provider subject, not email alone. Profile information may be synchronized but is not the primary identity key.

Sessions must be server-side with finite lifetime and secure cookies: HttpOnly, Secure in production and SameSite=Lax or stricter where compatible. Production must use a persistent/shared session store rather than Express MemoryStore.

Unauthenticated API requests return HTTP 401. Authenticated users without permission receive HTTP 403.

Logout must end the local session and should support identity-provider logout where available.

## 4. Authorization

Authorization is enforced by the backend. UI visibility is never a security boundary.

**User authorization roles and Person functional roles are separate systems.**

### Site administrator

A site administrator has global access and can manage Users, authorization, Teams and all team data. The final site administrator cannot be removed or demoted if that would leave the installation without an administrator.

### Team manager

A Team manager has management access only to explicitly assigned Teams and can manage People/team membership, Person functional roles, Events, Categories, Attendance, Staff assignments and relevant calendar feeds.

### Staff coordinator

A Staff coordinator can view the relevant Team, People and Events and manage Staff assignments, but does not automatically gain permission to manage People, Categories or Attendance.

### Team member

Team-member participation belongs to a Person and is not itself an application authorization role. A User associated with a Person can receive self-service access to that Person's attendance.

### Ownership-sensitive permissions

Permissions must distinguish between a User operating on their associated Person and a User managing other People. For example:

- `attendance:self` — modify attendance belonging to the Person explicitly associated with the authenticated User.
- `attendance:manage` — modify attendance for any Person in an authorized Team.

Ordinary self-service Users must not receive `attendance:manage` merely because they can modify their own attendance.

Authorization must use current server-side User/team role information so role changes and revocations do not remain effective indefinitely because of stale login-session data.

Every team-scoped operation must verify both the required User permission and that the requested resource belongs to an authorized Team. Cross-team access must never be possible through IDs or URLs.

## 5. People and teams

Authorized Team managers can add/remove People, edit Person information, manage Team membership and assign functional Person roles.

People and Users are independently managed. A Person may optionally be associated with an existing User, and the association can later be changed or removed without deleting either entity.

A Person may belong to multiple Teams with independent functional roles.

Site administrators manage creation, editing and deletion of Teams. Team slugs must be unique. Team deletion must follow explicit referential-integrity/cascade rules.

The primary team URL should be `/team/<slug>`, with the team overview as the main landing page. There should not be a redundant team page that provides little useful information.

## 6. Events and categories

Authorized users can create and manage Team Events with date/time, Category, location and description.

Events are shown chronologically. Location information should be a clickable link to a suitable map service.

Team managers can create, edit and delete Categories, including their display color and applicable staff roles. Historical events must not be unexpectedly destroyed when a Category is removed.

## 7. Attendance

Attendance is always associated with a Person and Event.

A User explicitly associated with a Person can manage that Person's own attendance when authorized. Team managers can manage attendance for People in their authorized Teams. A Person without a User can still have attendance records.

Attendance browsing is read-only by default. Changing attendance requires explicit edit mode/action so scrolling cannot accidentally modify data.

Bulk attendance allows an authorized User to select a Person and apply a state to multiple selected/filtered Events. Bulk changes require deliberate selection and explicit confirmation.

## 8. Staff assignments

Authorized Users can assign Staff to Events using applicable Team/Category staff roles.

A Person may have at most one staff role for a particular Event. A Person may only be assigned staff roles that they hold in the relevant Team. These rules must be enforced by the backend/database, not only the frontend.

## 9. Calendar feeds

The application provides iCalendar feeds for Teams and individual People.

Example patterns:

```text
/calendar/team/<team>.ics
/calendar/person/<person>.ics
```

Feed URLs containing unguessable access tokens are private credentials and must be treated accordingly.

The UI must expose calendar feed URLs as copyable links/text, not as a button whose primary action is downloading the file.

Timezone semantics must be preserved in generated calendar events.

## 10. User experience

The team overview should be the primary workspace and provide or directly expose:

- Upcoming Events
- Attendance overview
- People/participants
- Staff assignments
- Event information
- Calendar feed URL

Attendance and other potentially destructive operations should be read-only until explicit editing is enabled. Bulk operations require deliberate selection and confirmation.

The UI must work well on desktop, tablet and mobile. Mobile attendance use is especially important: controls must be easy to tap without accidental changes while scrolling.

Navigation must be team-context aware and show only functions the current User is authorized to use.

## 11. Internationalization

The UI must support English and Dutch (Belgian). All user-facing strings use a shared translation mechanism, including placeholders. New strings require both translations.

## 12. API and data model

The frontend communicates with the backend through a REST-style HTTP API. The backend is authoritative for all persistent operations and all authorization decisions.

The data model must contain at least:

- Users
- User/team authorization roles
- Persons
- Optional explicit User/Person associations
- Teams
- Team memberships
- Team-specific Person functional roles
- Categories
- Category staff roles
- Events
- Attendance
- Staff assignments

Users and Persons must be independently creatable, editable and deletable, subject to referential integrity.

Important integrity constraints should be enforced in the database, including unique Team slugs, unique Person/Team membership, unique Person/Event attendance, valid attendance states, valid staff assignments and valid User/Person associations.

Every mutating API endpoint must enforce authorization server-side and use appropriate HTTP status codes and consistent JSON errors.

## 13. Security

The application must:

- Require authentication for protected resources.
- Enforce authorization server-side.
- Prevent cross-Team data access.
- Validate OIDC state and nonce and use PKCE.
- Use secure session cookies.
- Protect session secrets and encryption keys.
- Validate user-controlled IDs, slugs and input.
- Use parameterized database queries.
- Never expose secrets or unnecessary internal errors.
- Treat calendar feed tokens as private credentials.
- Log security-relevant failures without passwords, tokens or secrets.
- Never infer a User/Person association from matching profile information.

## 14. Persistence and deployment

The application should be self-hostable with minimal operational complexity and support Docker Compose. SQLite on persistent storage is suitable for the initial deployment model.

Database schema changes use numbered migrations. Applied migrations must not be edited; changes use new migrations.

Configuration is supplied through environment variables, including application port/data directory, timezone, OIDC configuration and session secrets/configuration.

## 15. Suggested reference architecture

A suitable implementation may use:

- Node.js + Express backend
- SQLite with better-sqlite3 or equivalent
- HTML/CSS/vanilla JavaScript frontend
- OIDC Authorization Code + PKCE
- Server-side sessions with a production-capable persistent store
- iCalendar generation
- Docker Compose deployment

The frontend remains independent of the persistence layer. Business rules affecting security and data integrity belong in the backend/database.

## 16. Acceptance criteria

A complete implementation must at minimum demonstrate:

1. OIDC authentication creates/updates a User without creating a Person.
2. A Person can exist without a User.
3. A User can exist without a Person.
4. User/Person association is explicit and can be changed without deleting either entity.
5. The first administrator can create and manage Teams.
6. Team managers can manage only explicitly authorized Teams.
7. Users cannot access another Team's data.
8. Self-service Users can change their own associated Person's attendance but not another Person's attendance.
9. Team managers can manage attendance for People in their authorized Teams.
10. People can belong to multiple Teams with independent functional roles.
11. Events support date/time/category/location and clickable map locations.
12. Staff assignments enforce valid Person roles and uniqueness per Person/Event.
13. Team and Person calendar feeds are available and their URLs can be copied.
14. Attendance editing requires explicit intent and bulk changes require confirmation.
15. English and Belgian Dutch are supported.
16. The UI works on mobile and desktop.
17. Authorization changes take effect without indefinite reliance on stale session roles.
18. Database constraints prevent invalid relationships and cross-Team access.
19. Persistent application data survives container restarts.
20. No functionality depends on a special/default Team once real Teams exist.

## 17. Product principle

PandaPlan optimizes for **simple, safe team administration**:

> See what is happening → see who is involved → explicitly update attendance or staff when needed → move on.

The backend remains strict about identity, authorization, Team isolation and data integrity while the normal user workflow stays simple.