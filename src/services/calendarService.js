const db = require('../repositories/dbRepository');
const { buildCalendar } = require('../utils/ics');

function buildFullCalendarIcs() {
  const state = db.read();
  return buildCalendar('pandaplan', state.events, state.categories, state.persons, state.attendance);
}

// Returns null if the person doesn't exist, so the route can decide how
// to respond (a calendar-subscription 404 is plain text, not JSON, so
// this deliberately isn't an AppError going through the generic handler).
function buildPersonCalendarIcs(personId) {
  const state = db.read();
  const person = state.persons.find((p) => p.id === personId);
  if (!person) return null;
  const attending = state.attendance[person.id] || {};
  const events = state.events.filter((e) => attending[e.id]);
  const ics = buildCalendar(`pandaplan – ${person.name}`, events, state.categories, state.persons, state.attendance);
  return { ics, personName: person.name };
}

module.exports = { buildFullCalendarIcs, buildPersonCalendarIcs };
