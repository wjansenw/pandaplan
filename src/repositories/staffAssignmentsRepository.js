const { getDb } = require('../db/connection');

function findForEvent(eventId) {
  const db = getDb();
  const rows = db.prepare('SELECT person_id, role FROM staff_assignments WHERE event_id = ?').all(eventId);
  const result = {};
  rows.forEach((r) => {
    (result[r.role] || (result[r.role] = [])).push(r.person_id);
  });
  return result;
}

function findAllGroupedByEvent() {
  const db = getDb();
  const rows = db.prepare('SELECT event_id, person_id, role FROM staff_assignments').all();
  const result = {};
  rows.forEach((r) => {
    const forEvent = result[r.event_id] || (result[r.event_id] = {});
    (forEvent[r.role] || (forEvent[r.role] = [])).push(r.person_id);
  });
  return result;
}

// PRIMARY KEY (event_id, person_id) means a second call for the same
// pair can only ever change their role via this upsert — it can never
// create a second row, which is exactly "one role per person per event".
function assign(eventId, personId, role) {
  const db = getDb();
  db.prepare(`
    INSERT INTO staff_assignments (event_id, person_id, role) VALUES (?, ?, ?)
    ON CONFLICT(event_id, person_id) DO UPDATE SET role = excluded.role
  `).run(eventId, personId, role);
  return findForEvent(eventId);
}

function unassign(eventId, personId, role) {
  const db = getDb();
  db.prepare('DELETE FROM staff_assignments WHERE event_id = ? AND person_id = ? AND role = ?')
    .run(eventId, personId, role);
  return findForEvent(eventId);
}

module.exports = { findForEvent, findAllGroupedByEvent, assign, unassign };
