const {
  SITE_ADMIN_ROLE,
  ALL_TEAM_ROLES,
} = require('../../auth/roles');

module.exports = {
  name: '006_add_authorization_accounts',

  up(db) {
    const rolePlaceholders = ALL_TEAM_ROLES.map(() => '?').join(',');

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
        role TEXT NOT NULL CHECK (role IN (${rolePlaceholders})),
        PRIMARY KEY (account_id, team_id)
      );

      CREATE INDEX idx_account_team_roles_team
        ON account_team_roles(team_id);
    `, ...ALL_TEAM_ROLES);

    // Keep the site-admin role vocabulary explicit even though site-admin
    // is represented as an account flag rather than a team membership.
    if (SITE_ADMIN_ROLE !== 'site_admin') {
      throw new Error('unexpected site admin role identifier');
    }
  },
};
