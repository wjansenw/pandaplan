const VALID_ROLES = [
  'participant',
  'coach',
  'assistant-coach',
  'trainer',
  'scorekeeper',
  'referee',
];

module.exports = {
  name: '002_add_teams',
  up(db) {
    db.exec(`
      CREATE TABLE teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE team_memberships (
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        PRIMARY KEY (team_id, person_id)
      );
      CREATE INDEX idx_team_memberships_person ON team_memberships(person_id);

      CREATE TABLE team_membership_roles (
        team_id TEXT NOT NULL,
        person_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('participant', 'coach', 'assistant-coach', 'trainer', 'scorekeeper', 'referee')),
        PRIMARY KEY (team_id, person_id, role),
        FOREIGN KEY (team_id, person_id) REFERENCES team_memberships(team_id, person_id) ON DELETE CASCADE
      );
      CREATE INDEX idx_team_membership_roles_person ON team_membership_roles(person_id);

      INSERT INTO teams (id, name, slug, description)
      VALUES ('default', 'Default Team', 'default', '');

      ALTER TABLE categories ADD COLUMN team_id TEXT REFERENCES teams(id) ON DELETE CASCADE;
      ALTER TABLE events ADD COLUMN team_id TEXT REFERENCES teams(id) ON DELETE CASCADE;

      UPDATE categories SET team_id = 'default';
      UPDATE events SET team_id = 'default';

      INSERT INTO team_memberships (team_id, person_id)
      SELECT 'default', id FROM persons;

      INSERT INTO team_membership_roles (team_id, person_id, role)
      SELECT 'default', p.id,
             CASE WHEN pr.role IN ('participant', 'coach', 'assistant-coach', 'trainer', 'scorekeeper', 'referee')
                  THEN pr.role ELSE 'participant' END
      FROM persons p
      LEFT JOIN person_roles pr ON pr.person_id = p.id;

      INSERT OR IGNORE INTO team_membership_roles (team_id, person_id, role)
      SELECT 'default', id, 'participant'
      FROM persons
      WHERE id NOT IN (
        SELECT person_id FROM team_membership_roles WHERE team_id = 'default'
      );

      CREATE INDEX idx_categories_team ON categories(team_id);
      CREATE INDEX idx_events_team ON events(team_id);

      CREATE TABLE staff_assignments_new (
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL,
        role TEXT NOT NULL,
        PRIMARY KEY (event_id, person_id),
        FOREIGN KEY (team_id, person_id, role) REFERENCES team_membership_roles(team_id, person_id, role) ON DELETE CASCADE
      );

      INSERT INTO staff_assignments_new (event_id, team_id, person_id, role)
      SELECT sa.event_id, e.team_id, sa.person_id, sa.role
      FROM staff_assignments sa
      JOIN events e ON e.id = sa.event_id
      JOIN team_membership_roles tmr
        ON tmr.team_id = e.team_id
       AND tmr.person_id = sa.person_id
       AND tmr.role = sa.role;

      DROP TABLE staff_assignments;
      ALTER TABLE staff_assignments_new RENAME TO staff_assignments;
      CREATE INDEX idx_staff_assignments_event ON staff_assignments(event_id);
      CREATE INDEX idx_staff_assignments_person ON staff_assignments(person_id);

      DROP TABLE person_roles;
    `);

    const invalidRoleCount = db.prepare(
      `SELECT COUNT(*) AS n FROM team_membership_roles WHERE role NOT IN (${VALID_ROLES.map(() => '?').join(',')})`
    ).get(...VALID_ROLES).n;
    if (invalidRoleCount) throw new Error(`migration produced ${invalidRoleCount} invalid team roles`);
  },
};
