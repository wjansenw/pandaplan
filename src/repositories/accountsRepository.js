const crypto = require('crypto');
const { getDb } = require('../db/connection');
const { isTeamRole } = require('../auth/roles');
const AppError = require('../errors');

function toAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    providerSubject: row.provider_subject,
    email: row.email,
    name: row.name,
    isSiteAdmin: Boolean(row.is_site_admin),
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    teamRoles: row.team_roles ? JSON.parse(row.team_roles) : [],
  };
}

function findByIdentity(provider, providerSubject) {
  const db = getDb();
  return toAccount(db.prepare(`
    SELECT a.*, COALESCE(json_group_array(
      CASE WHEN atr.team_id IS NULL THEN NULL ELSE json_object('teamId', atr.team_id, 'role', atr.role) END
    ) FILTER (WHERE atr.team_id IS NOT NULL), '[]') AS team_roles
    FROM accounts a
    LEFT JOIN account_team_roles atr ON atr.account_id = a.id
    WHERE a.provider = ? AND a.provider_subject = ?
    GROUP BY a.id
  `).get(provider, providerSubject));
}

function findAll() {
  const db = getDb();
  return db.prepare(`
    SELECT a.id, a.provider, a.provider_subject, a.email, a.name,
           a.is_site_admin, a.created_at, a.last_login_at,
           COALESCE(json_group_array(
             CASE WHEN atr.team_id IS NULL THEN NULL ELSE json_object(
               'teamId', atr.team_id, 'teamName', t.name, 'role', atr.role
             ) END
           ) FILTER (WHERE atr.team_id IS NOT NULL), '[]') AS team_roles
    FROM accounts a
    LEFT JOIN account_team_roles atr ON atr.account_id = a.id
    LEFT JOIN teams t ON t.id = atr.team_id
    GROUP BY a.id
    ORDER BY lower(a.name), lower(a.email)
  `).all().map(toAccount);
}

function findById(id) {
  const db = getDb();
  return toAccount(db.prepare(`
    SELECT a.*, COALESCE(json_group_array(
      CASE WHEN atr.team_id IS NULL THEN NULL ELSE json_object('teamId', atr.team_id, 'role', atr.role) END
    ) FILTER (WHERE atr.team_id IS NOT NULL), '[]') AS team_roles
    FROM accounts a
    LEFT JOIN account_team_roles atr ON atr.account_id = a.id
    WHERE a.id = ?
    GROUP BY a.id
  `).get(id));
}

function findOrCreateFromOidc({ provider, providerSubject, email, name }) {
  const db = getDb();
  const existing = findByIdentity(provider, providerSubject);
  if (existing) {
    db.prepare('UPDATE accounts SET email = ?, name = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(email || '', name || '', existing.id);
    return findById(existing.id);
  }

  const create = db.transaction(() => {
    const firstUser = db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n === 0;
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO accounts (id, provider, provider_subject, email, name, is_site_admin, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, provider, providerSubject, email || '', name || '', firstUser ? 1 : 0);
    return id;
  });

  return findById(create());
}

function setSiteAdmin(id, isSiteAdmin) {
  const db = getDb();
  const value = isSiteAdmin ? 1 : 0;
  if (!value && db.prepare('SELECT COUNT(*) AS n FROM accounts WHERE is_site_admin = 1').get().n <= 1) {
    throw new AppError(400, 'cannot remove the last site administrator');
  }
  db.prepare('UPDATE accounts SET is_site_admin = ? WHERE id = ?').run(value, id);
  return findById(id);
}

function setTeamRole(accountId, teamId, role) {
  const db = getDb();
  if (role !== null && !isTeamRole(role)) throw new AppError(400, 'invalid team role');
  if (!db.prepare('SELECT 1 FROM accounts WHERE id = ?').get(accountId)) throw new AppError(404, 'account not found');
  if (!db.prepare('SELECT 1 FROM teams WHERE id = ?').get(teamId)) throw new AppError(404, 'team not found');

  if (role === null) {
    db.prepare('DELETE FROM account_team_roles WHERE account_id = ? AND team_id = ?').run(accountId, teamId);
  } else {
    db.prepare(`
      INSERT INTO account_team_roles (account_id, team_id, role)
      VALUES (?, ?, ?)
      ON CONFLICT(account_id, team_id) DO UPDATE SET role = excluded.role
    `).run(accountId, teamId, role);
  }
  return findById(accountId);
}

function listTeams() {
  return getDb().prepare('SELECT id, name, slug FROM teams ORDER BY lower(name)').all();
}

module.exports = { findByIdentity, findAll, findById, findOrCreateFromOidc, setSiteAdmin, setTeamRole, listTeams };
