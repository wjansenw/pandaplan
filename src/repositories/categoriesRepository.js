const { getDb } = require('../db/connection');

function findAll() {
  const db = getDb();
  const categories = db.prepare('SELECT id, name, color FROM categories ORDER BY rowid').all();
  const roleRows = db.prepare('SELECT category_id, role FROM category_staff_roles').all();
  const rolesByCategory = {};
  roleRows.forEach((r) => {
    (rolesByCategory[r.category_id] || (rolesByCategory[r.category_id] = [])).push(r.role);
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    requiredStaffRoles: rolesByCategory[c.id] || [],
  }));
}

function count() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
}

function create({ id, name, color, requiredStaffRoles }) {
  const db = getDb();
  const insertCategory = db.prepare('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)');
  const insertRole = db.prepare('INSERT INTO category_staff_roles (category_id, role) VALUES (?, ?)');
  const txn = db.transaction(() => {
    insertCategory.run(id, name, color);
    requiredStaffRoles.forEach((r) => insertRole.run(id, r));
  });
  txn();
  return findAll();
}

function update(id, { requiredStaffRoles }) {
  const db = getDb();
  const txn = db.transaction(() => {
    if (requiredStaffRoles !== undefined) {
      db.prepare('DELETE FROM category_staff_roles WHERE category_id = ?').run(id);
      const insertRole = db.prepare('INSERT INTO category_staff_roles (category_id, role) VALUES (?, ?)');
      requiredStaffRoles.forEach((r) => insertRole.run(id, r));
    }
  });
  txn();
  return findAll();
}

function remove(id) {
  const db = getDb();
  // ON DELETE CASCADE clears category_staff_roles; events referencing
  // this category have ON DELETE SET NULL, so they become uncategorized
  // rather than being deleted.
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return findAll();
}

module.exports = { findAll, count, create, update, remove };
