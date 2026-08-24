const { getDb } = require('../db/connection');

function findAll() {
  const db = getDb();
  const persons = db.prepare('SELECT id, name FROM persons ORDER BY rowid').all();
  const roleRows = db.prepare('SELECT person_id, role FROM person_roles').all();
  const rolesByPerson = {};
  roleRows.forEach((r) => {
    (rolesByPerson[r.person_id] || (rolesByPerson[r.person_id] = [])).push(r.role);
  });
  return persons.map((p) => ({ id: p.id, name: p.name, roles: rolesByPerson[p.id] || [] }));
}

function findById(id) {
  const db = getDb();
  const person = db.prepare('SELECT id, name FROM persons WHERE id = ?').get(id);
  if (!person) return null;
  const roles = db.prepare('SELECT role FROM person_roles WHERE person_id = ?').all(id).map((r) => r.role);
  return { id: person.id, name: person.name, roles };
}

function create({ id, name, roles }) {
  const db = getDb();
  const insertPerson = db.prepare('INSERT INTO persons (id, name) VALUES (?, ?)');
  const insertRole = db.prepare('INSERT INTO person_roles (person_id, role) VALUES (?, ?)');
  const txn = db.transaction(() => {
    insertPerson.run(id, name);
    roles.forEach((r) => insertRole.run(id, r));
  });
  txn();
  return findAll();
}

function update(id, { name, roles }) {
  const db = getDb();
  const txn = db.transaction(() => {
    if (typeof name === 'string' && name.trim()) {
      db.prepare('UPDATE persons SET name = ? WHERE id = ?').run(name.trim(), id);
    }
    if (roles !== undefined) {
      // Diff rather than delete-all-then-reinsert: a role that's kept
      // across the update must NOT have its person_roles row touched,
      // because deleting it would cascade-delete any staff_assignments
      // depending on that role even though the person still holds it.
      const current = new Set(
        db.prepare('SELECT role FROM person_roles WHERE person_id = ?').all(id).map((r) => r.role)
      );
      const next = new Set(roles);
      const toRemove = [...current].filter((r) => !next.has(r));
      const toAdd = [...next].filter((r) => !current.has(r));
      const del = db.prepare('DELETE FROM person_roles WHERE person_id = ? AND role = ?');
      const ins = db.prepare('INSERT INTO person_roles (person_id, role) VALUES (?, ?)');
      toRemove.forEach((r) => del.run(id, r));
      toAdd.forEach((r) => ins.run(id, r));
    }
  });
  txn();
  return findAll();
}

function remove(id) {
  const db = getDb();
  // ON DELETE CASCADE handles person_roles, attendance, and
  // staff_assignments rows for this person automatically.
  db.prepare('DELETE FROM persons WHERE id = ?').run(id);
  return findAll();
}

module.exports = { findAll, findById, create, update, remove };
