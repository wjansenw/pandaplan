const { getDb } = require('../db/connection');

function findAll() {
  const db = getDb();
  const categories = db.prepare('SELECT id, team_id AS teamId, name, color FROM categories ORDER BY rowid').all();
  const roleRows = db.prepare('SELECT category_id, role FROM category_staff_roles').all();
  const rolesByCategory = {};
  roleRows.forEach((r) => (rolesByCategory[r.category_id] || (rolesByCategory[r.category_id] = [])).push(r.role));
  return categories.map((c) => ({ ...c, requiredStaffRoles: rolesByCategory[c.id] || [] }));
}

function findById(id) {
  return findAll().find((category) => category.id === id) || null;
}

function findByTeam(teamId) {
  return findAll().filter((category) => category.teamId === teamId);
}

module.exports = { findAll, findById, findByTeam };
