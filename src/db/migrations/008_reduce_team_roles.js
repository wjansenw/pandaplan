// staff_coordinator no longer exists as a role (see src/auth/roles.js) —
// team_member now grants everything staff_coordinator used to (roster:manage
// covers both attendance and staff), so existing staff_coordinator rows are
// remapped to team_member, not dropped. SQLite can't ALTER a CHECK
// constraint, so the table is recreated (same idiom as migration 005).
module.exports = {
  name: '008_reduce_team_roles',

  up(db) {
    db.exec(`
      CREATE TABLE account_team_roles_new (
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('team_member', 'team_manager')),
        PRIMARY KEY (account_id, team_id)
      );

      INSERT INTO account_team_roles_new (account_id, team_id, role)
      SELECT account_id, team_id,
        CASE WHEN role = 'staff_coordinator' THEN 'team_member' ELSE role END
      FROM account_team_roles;

      DROP TABLE account_team_roles;

      ALTER TABLE account_team_roles_new
        RENAME TO account_team_roles;

      CREATE INDEX idx_account_team_roles_team
        ON account_team_roles(team_id);
    `);
  },
};
