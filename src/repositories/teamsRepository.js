const { getDb } = require('../db/connection');

function findAll() {
  const db = getDb();
  return db.prepare(`
    SELECT t.id, t.name, t.slug, t.description, COUNT(tm.person_id) AS memberCount
    FROM teams t
    LEFT JOIN team_memberships tm ON tm.team_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `).all();
}

function findAllForAccount(account) {
  if (account?.isSiteAdmin) return findAll();
  const teamIds = (account?.teamRoles || []).map((membership) => membership.teamId).filter(Boolean);
  if (!teamIds.length) return [];
  const placeholders = teamIds.map(() => '?').join(',');
  return getDb().prepare(`
    SELECT t.id, t.name, t.slug, t.description, COUNT(tm.person_id) AS memberCount
    FROM teams t
    LEFT JOIN team_memberships tm ON tm.team_id = t.id
    WHERE t.id IN (${placeholders})
    GROUP BY t.id
    ORDER BY t.name
  `).all(...teamIds);
}

function findBySlug(slug) {
  return getDb().prepare('SELECT id, name, slug, description FROM teams WHERE slug = ?').get(slug) || null;
}

function findMembers(teamId) {
  const db = getDb();
  const persons = db.prepare(`
    SELECT p.id, p.name
    FROM persons p
    JOIN team_memberships tm ON tm.person_id = p.id
    WHERE tm.team_id = ?
    ORDER BY p.name
  `).all(teamId);
  const roles = db.prepare('SELECT person_id, role FROM team_membership_roles WHERE team_id = ?').all(teamId);
  const rolesByPerson = {};
  roles.forEach((r) => (rolesByPerson[r.person_id] || (rolesByPerson[r.person_id] = [])).push(r.role));
  return persons.map((p) => ({ ...p, roles: rolesByPerson[p.id] || [] }));
}

function create({ id, name, slug, description }) {
  getDb().prepare('INSERT INTO teams (id, name, slug, description) VALUES (?, ?, ?, ?)').run(id, name, slug, description || '');
  return findBySlug(slug);
}

function update(id, { name, slug, description }) {
  getDb().prepare('UPDATE teams SET name = ?, slug = ?, description = ? WHERE id = ?').run(name, slug, description || '', id);
  return getDb().prepare('SELECT id, name, slug, description FROM teams WHERE id = ?').get(id);
}

function count() {
  return getDb().prepare('SELECT COUNT(*) AS n FROM teams').get().n;
}

function remove(id) {
  getDb().prepare('DELETE FROM teams WHERE id = ?').run(id);
}

function addMember(teamId, personId, roles = ['participant']) {
  const db = getDb();
  const txn = db.transaction(() => {
    db.prepare('INSERT INTO team_memberships (team_id, person_id) VALUES (?, ?)').run(teamId, personId);
    const insertRole = db.prepare('INSERT INTO team_membership_roles (team_id, person_id, role) VALUES (?, ?, ?)');
    roles.forEach((role) => insertRole.run(teamId, personId, role));
  });
  txn();
}

function removeMember(teamId, personId) {
  getDb().prepare('DELETE FROM team_memberships WHERE team_id = ? AND person_id = ?').run(teamId, personId);
}

function setRoles(teamId, personId, roles) {
  const db = getDb();
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM team_membership_roles WHERE team_id = ? AND person_id = ?').run(teamId, personId);
    const insert = db.prepare('INSERT INTO team_membership_roles (team_id, person_id, role) VALUES (?, ?, ?)');
    roles.forEach((role) => insert.run(teamId, personId, role));
  });
  txn();
}

function isMember(teamId, personId) {
  return !!getDb().prepare('SELECT 1 FROM team_memberships WHERE team_id = ? AND person_id = ?').get(teamId, personId);
}

function hasRole(teamId, personId, role) {
  return !!getDb().prepare('SELECT 1 FROM team_membership_roles WHERE team_id = ? AND person_id = ? AND role = ?').get(teamId, personId, role);
}

module.exports = { findAll, findAllForAccount, findBySlug, findMembers, create, update, count, remove, addMember, removeMember, setRoles, isMember, hasRole };
