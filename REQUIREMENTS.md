# PandaPlan — Product Requirements

## 1. Purpose

PandaPlan is a self-hosted web application for clubs, sports teams and similar groups that need a simple way to manage teams, people, events, attendance and staff assignments.

The application should make routine team administration fast and safe, while remaining simple enough for participants to use without training.

The requirements below describe the product independently of the current implementation. A new implementation should be able to use this document as its functional specification.

## 2. Core concepts

### 2.1 Account and Person are independent entities

**Account and Person are deliberately separate concepts and must be modeled as independent entities. Neither is a subtype of the other, and neither is required to exist for the other to exist.**

An **Account** represents an identity that can authenticate to PandaPlan. It is concerned with access to the application, authentication and authorization.

A **Person** represents an individual who participates in the club/team domain. It is concerned with team membership, participation, attendance and functional roles such as player, coach or referee.

The following rules are fundamental:

- A Person can exist without an Account. For example, a child/player may be managed by a parent or team administrator without ever logging into PandaPlan.
- An Account can exist without being a Person. For example, an administrator may need application access without being a player, coach or other team participant.
- An Account and a Person may optionally be associated, but this association is not the identity of either entity.
- An Account may not automatically become a Person merely because the user logs in.
- A Person may not automatically receive an Account merely because their contact details match an authenticated user.
- Email addresses, names and other profile fields must not be used to implicitly merge an Account and Person.
- Authorization is based on the Account and its memberships/roles; team participation and attendance are based on Person and team membership.
- When an Account is deleted or loses application access, the associated Person must remain intact unless the Person is explicitly deleted through person management.
- When a Person is deleted, the associated Account must remain intact unless the Account is explicitly deleted through account management.

If an Account is associated with a Person, the relationship must be explicit and represented separately from both entities.

### 2.2 Account

An account represents an identity authenticated through an external identity provider. Authentication identifies the account; application authorization determines what that account may do.

An account may have access to multiple teams and may have a different application role in each team.

An account does not represent team participation. An account may be authorized to manage a team without itself being a member/person in that team.

### 2.3 Team

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

### 2.4 Person

A person is an independent domain entity representing an individual who may belong to one or more teams.

A person can have multiple functional roles within a team, such as participant, coach, assistant coach, trainer, scorekeeper or referee.

Functional person roles describe what the person does in the team. They are distinct from account/application roles, which control access to PandaPlan.

A person does not need an Account to be included in a team, event, attendance record or staff assignment.

### 2.5 Event

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

### 2.6 Category

A category is a team-specific classification of events. It has a name and display color and may define the staff roles applicable to events in that category.

### 2.7 Attendance

Attendance is recorded per Person and Event. It is not recorded against an Account.

Supported states:

- Going
- Maybe
- Not going
- Unknown / no response

An attendance record may contain an optional note.

When an Account is associated with a Person, that Account may be allowed to manage that Person's own attendance. This is an authorization relationship, not an indication that the Account and Person are the same entity.

## 3. Authentication

### 3.1 Identity provider

The application should support OpenID Connect (OIDC) authentication.

The preferred flow is Authorization Code with PKCE (S256), with state and nonce validation.

The application must not handle or store the user's identity-provider password.

### 3.2 Account identity

An authenticated account must be identified by the identity provider and stable provider subject, not by email address alone.

Email, display name and other profile information may be synchronized from the identity provider but must not be the primary identity key.

OIDC authentication creates or updates an **Account**. It must not implicitly create or modify a **Person**.

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

Application roles belong to Accounts. Functional/team roles belong to Persons. These role systems must remain separate.

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

The term “team member” refers to a Person's participation in a team, not necessarily to an Account having access to PandaPlan. A Person may be a team member without having an Account.

### 4.5 Ownership-sensitive permissions

Permissions must distinguish between operations on the user's own data and management operations on other users' data.

For example:

- `attendance:self` — an authenticated Account may change attendance belonging to the Person explicitly associated with that Account
- `attendance:manage` — an authorized Account may change attendance for any Person in an authorized team

A generic `attendance:manage` permission must not be granted to ordinary team members merely because they are allowed to record their own attendance.

### 4.6 Authorization evaluation

Authorization must evaluate current server-side role/membership information. Application roles stored in a login session must not become a stale security decision after an administrator changes a user's permissions.

At minimum, sensitive authorization decisions must use current account/team membership data or a deliberately short-lived, invalidatable authorization cache.

### 4.7 Team isolation

Every team-scoped API operation must verify both:

1. The authenticated Account has the required permission.
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
- Optionally associate a Person with an existing Account
- Remove or change an Account/Person association without deleting either entity

A person may belong to multiple teams. Team membership and team-specific roles must therefore be modeled independently from the global person record.

A Person may be managed entirely by an administrator without having an Account.

Removing a person from a team must remove or invalidate team-specific assignments that can no longer be valid.

Deleting a Person must not implicitly delete an Account. Deleting an Account must not implicitly delete a Person.

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

Attendance belongs to a Person and Event.

A Person associated with the authenticated Account can change their own attendance when the Account has the required self-service permission.

Authorized managers can change attendance for Persons in their team.

A Person without an Account can still have attendance records. An authorized Account must be able to manage that attendance through normal team management.

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

- Accounts and authorization
- Teams
- People
- Team memberships
- Functional roles
- Account/Person associations
- Events
- Categories
- Attendance
- Staff assignments

The frontend must never bypass authorization or persistence rules by directly manipulating the database.

Every mutating API endpoint must enforce authorization on the server.

API responses should use appropriate HTTP status codes and consistent JSON error structures.

## 17. Data model requirements

The persistent data model must represent at least:

- Accounts
- Account/team authorization roles
- Persons
- Optional explicit Account/Person associations
- Teams
- Team memberships
- Team-specific functional roles
- Categories
- Category staff roles
- Events
- Attendance
- Staff assignments

Account and Person records must be independently creatable, editable and deletable, subject to normal referential-integrity rules.

Important integrity rules should be enforced in the database wherever practical, including:

- Unique team slugs
- Unique team/person membership
- Unique person/event attendance
- Valid attendance states
- Maximum one staff role per person/event
- Staff role must belong to the person's team roles
- An optional Account/Person association must reference existing entities
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
- Never infer an Account/Person association solely from matching email addresses or other profile fields.

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
2. OIDC authentication creates or updates an Account without implicitly creating a Person.
3. A Person can exist without an Account.
4. An Account can exist without a Person.
5. An administrator can explicitly associate an Account with a Person and later change/remove that association without deleting either entity.
6. The first configured administrator can create and manage teams.
7. A team manager can manage only the teams to which they are assigned.
8. A team member cannot access or modify another team's data.
9. A team member can change their own attendance but cannot manage another participant's attendance.
10. A team manager can manage attendance for participants in their authorized team.
11. People can belong to multiple teams with independent team roles.
12. Events can be created, edited and displayed with date/time/category/location.
13. Event locations are clickable map links.
14. Staff can be assigned to events using valid team staff roles.
15. The system prevents more than one staff role for the same person/event.
16. Team and person calendar feeds are available and their URLs can be copied.
17. Attendance browsing does not accidentally modify data; editing requires explicit intent.
18. Bulk attendance changes require explicit selection and confirmation.
19. English and Belgian Dutch are supported throughout the UI.
20. The UI works on desktop and mobile.
21. Authorization changes take effect without relying indefinitely on stale login-session role data.
22. Database integrity rules prevent invalid cross-team or orphaned relationships.
23. Container restart does not lose persistent application data or unexpectedly invalidate all sessions in a production deployment.
24. No functionality depends on a special/default team once real teams exist.

## 23. Product principle

PandaPlan should optimize for **simple, safe team administration**.

The application should make the common operations obvious:

> See what is happening → see who is involved → update attendance or staff when explicitly requested → move on.

Complexity should be kept out of the normal user workflow, while the backend remains strict about identity, authorization, team isolation and data integrity.
