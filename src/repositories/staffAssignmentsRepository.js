const { getDb } = require('../db/connection');

function findForEvent(eventId) {
  const rows = getDb().prepare('SELECT person_id, role FROM staff_assignments WHERE event_id = ?').all(eventId);
  const result = {};
  rows.forEach((r) => (result[r.role] || (result[r.role] = [])).push(r.person_id));
  return result;
}

function findAllGroupedByEvent() {
  const rows = getDb().prepare('SELECT event_id, person_id, role FROM staff_assignments').all();
  const result = {};
  rows.forEach((r) => {
    const event = result[r.event_id] || (result[r.event_id] = {});
    (event[r.role] || (event[r.role] = [])).push(r.person_id);
  });
  return result;
}

module.exports = { findForEvent, findAllGroupedByEvent };
