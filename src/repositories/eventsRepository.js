const { getDb } = require('../db/connection');

const SELECT_COLUMNS = `
  id,
  category_id AS categoryId,
  date,
  start_time AS startTime,
  end_time AS endTime,
  location,
  description
`;

function findAll() {
  const db = getDb();
  return db.prepare(`SELECT ${SELECT_COLUMNS} FROM events ORDER BY date, start_time`).all();
}

function create({ id, categoryId, date, startTime, endTime, location, description }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO events (id, category_id, date, start_time, end_time, location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, categoryId || null, date, startTime || '', endTime || '', location || '', description || '');
  return findAll();
}

function update(id, { categoryId, date, startTime, endTime, location, description }) {
  const db = getDb();
  db.prepare(`
    UPDATE events
    SET category_id = ?, date = ?, start_time = ?, end_time = ?, location = ?, description = ?
    WHERE id = ?
  `).run(categoryId || null, date, startTime || '', endTime || '', location || '', description || '', id);
  return findAll();
}

function remove(id) {
  const db = getDb();
  // ON DELETE CASCADE clears attendance and staff_assignments for this event.
  db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return findAll();
}

module.exports = { findAll, create, update, remove };
