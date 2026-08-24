const { getDb } = require('../db/connection');

function findAll() {
  const db = getDb();
  const rows = db.prepare('SELECT person_id, event_id, status, note FROM attendance').all();
  const result = {};
  rows.forEach((r) => {
    (result[r.person_id] || (result[r.person_id] = {}))[r.event_id] = { status: r.status, note: r.note };
  });
  return result;
}

function findForPerson(personId) {
  const db = getDb();
  const rows = db.prepare('SELECT event_id, status, note FROM attendance WHERE person_id = ?').all(personId);
  const result = {};
  rows.forEach((r) => {
    result[r.event_id] = { status: r.status, note: r.note };
  });
  return result;
}

function setStatus(personId, eventId, status, note) {
  const db = getDb();
  if (status) {
    db.prepare(`
      INSERT INTO attendance (person_id, event_id, status, note) VALUES (?, ?, ?, ?)
      ON CONFLICT(person_id, event_id) DO UPDATE SET status = excluded.status, note = excluded.note
    `).run(personId, eventId, status, note);
  } else {
    // No status means "unknown" — clear any existing entry.
    db.prepare('DELETE FROM attendance WHERE person_id = ? AND event_id = ?').run(personId, eventId);
  }
  return findForPerson(personId);
}

module.exports = { findAll, findForPerson, setStatus };
