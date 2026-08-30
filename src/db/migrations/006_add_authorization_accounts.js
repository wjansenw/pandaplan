const { ALL_TEAM_ROLES } = require('../../auth/roles');

module.exports = {
  name: '006_add_authorization_accounts',

  up(db) {
    const roleValues = ALL_TEAM_ROLES.map((role) => `'${role.replace(/'/g, "''")}'`).join(', ');

    db.exec(`
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_subject TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        is_site_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_site_admin IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TEXT,
        UNIQUE (provider, provider_subject)
      );

      CREATE TABLE account_team_roles (
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN (${roleValues})),
        PRIMARY KEY (account_id, team_id)
      );

      CREATE INDEX idx_account_team_roles_team
        ON account_team_roles(team_id);
    `);
  },
};
