// Migration files are applied in filename order, once each, tracked in
// the schema_migrations table. Never edit an already-applied migration —
// add a new numbered file instead, even for a small fix. That table
// *is* the "which version is this database at" tracking: on startup the
// app applies whatever hasn't run yet and stops there.
module.exports = {
  name: '001_initial_schema',
  up(db) {
    db.exec(`
      CREATE TABLE persons (
        id   TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );

      -- A person can hold several roles at once (participant, coach,
      -- referee, ...), so this is a many-to-many table, not a column.
      CREATE TABLE person_roles (
        person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        role      TEXT NOT NULL,
        PRIMARY KEY (person_id, role)
      );

      CREATE TABLE categories (
        id    TEXT PRIMARY KEY,
        name  TEXT NOT NULL,
        color TEXT NOT NULL
      );

      CREATE TABLE category_staff_roles (
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        role        TEXT NOT NULL,
        PRIMARY KEY (category_id, role)
      );

      CREATE TABLE events (
        id          TEXT PRIMARY KEY,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        date        TEXT NOT NULL,
        start_time  TEXT NOT NULL DEFAULT '',
        end_time    TEXT NOT NULL DEFAULT '',
        location    TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX idx_events_date ON events(date);
      CREATE INDEX idx_events_category ON events(category_id);

      CREATE TABLE attendance (
        person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        event_id  TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        status    TEXT NOT NULL CHECK (status IN ('yes', 'no', 'maybe')),
        note      TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (person_id, event_id)
      );
      CREATE INDEX idx_attendance_event ON attendance(event_id);

      -- PRIMARY KEY (event_id, person_id) is what enforces "one role per
      -- person per event" — a second INSERT for the same pair can only
      -- ever change their role (via the upsert in the repository), never
      -- add a second row. The composite foreign key to person_roles
      -- enforces "can't assign a role this person doesn't actually
      -- hold", and ON DELETE CASCADE means if someone's role is revoked,
      -- any staff assignment depending on it disappears automatically —
      -- both of these used to be hand-written, easy-to-get-wrong JS
      -- logic; now they're guaranteed by the schema itself.
      CREATE TABLE staff_assignments (
        event_id  TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL,
        role      TEXT NOT NULL,
        PRIMARY KEY (event_id, person_id),
        FOREIGN KEY (person_id, role) REFERENCES person_roles(person_id, role) ON DELETE CASCADE
      );
      CREATE INDEX idx_staff_assignments_event ON staff_assignments(event_id);
    `);
  },
};
