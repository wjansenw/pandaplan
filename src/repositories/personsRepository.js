const { getDb } = require('../db/connection');
const { generateToken } = require('../utils/id');

function findAll() {
  return getDb().prepare('SELECT id, name, calendar_token AS calendarToken FROM persons ORDER BY rowid').all();
}

function findById(id) {
  return getDb().prepare('SELECT id, name, calendar_token AS calendarToken FROM persons WHERE id = ?').get(id) || null;
}

function findByCalendarToken(token) {
  return getDb().prepare('SELECT id, name, calendar_token AS calendarToken FROM persons WHERE calendar_token = ?').get(token) || null;
}

function create({ id, name }) {
  getDb().prepare('INSERT INTO persons (id, name, calendar_token) VALUES (?, ?, ?)').run(id, name, generateToken());
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

module.exports = { findAll, findById, findByCalendarToken, create, update, remove };
