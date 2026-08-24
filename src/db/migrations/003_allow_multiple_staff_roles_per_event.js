module.exports = {
  name: '003_allow_multiple_staff_roles_per_event',
  up(db) {
    db.exec(`
      CREATE TABLE staff_assignments_new (
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL,
        role TEXT NOT NULL,
        PRIMARY KEY (event_id, person_id, role),
        FOREIGN KEY (team_id, person_id, role)
          REFERENCES team_membership_roles(team_id, person_id, role)
          ON DELETE CASCADE
      );

      INSERT INTO staff_assignments_new (event_id, team_id, person_id, role)
      SELECT event_id, team_id, person_id, role
      FROM staff_assignments;

      DROP TABLE staff_assignments;
      ALTER TABLE staff_assignments_new RENAME TO staff_assignments;
      CREATE INDEX idx_staff_assignments_event ON staff_assignments(event_id);
      CREATE INDEX idx_staff_assignments_person ON staff_assignments(person_id);
    `);
  },
};
