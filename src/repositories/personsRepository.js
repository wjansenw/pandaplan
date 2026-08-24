const { getDb } = require('../db/connection');

function findAll() {
  return getDb().prepare('SELECT id, name FROM persons ORDER BY rowid').all();
}

function findById(id) {
  return getDb().prepare('SELECT id, name FROM persons WHERE id = ?').get(id) || null;
}

function create({ id, name }) {
  getDb().prepare('INSERT INTO persons (id, name) VALUES (?, ?)').run(id, name);
  return findAll();
}

function update(id, { name }) {
  if (typeof name === 'string' && name.trim()) getDb().prepare('UPDATE persons SET name = ? WHERE id = ?').run(name.trim(), id);
  return findAll();
}

function remove(id) {
  getDb().prepare('DELETE FROM persons WHERE id = ?').run(id);
  return findAll();
}

module.exports = { findAll, findById, create, update, remove };
