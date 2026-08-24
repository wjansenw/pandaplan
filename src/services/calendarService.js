const personsRepository = require('../repositories/personsRepository');
const categoriesRepository = require('../repositories/categoriesRepository');
const eventsRepository = require('../repositories/eventsRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const { buildCalendar } = require('../utils/ics');

function buildFullCalendarIcs() {
  return buildCalendar(
    'pandaplan',
    eventsRepository.findAll(),
    categoriesRepository.findAll(),
    personsRepository.findAll(),
    attendanceRepository.findAll()
  );
}

// Returns null if the person doesn't exist, so the route can decide how
// to respond (a calendar-subscription 404 is plain text, not JSON, so
// this deliberately isn't an AppError going through the generic handler).
function buildPersonCalendarIcs(personId) {
  const person = personsRepository.findById(personId);
  if (!person) return null;

  const attending = attendanceRepository.findForPerson(person.id);
  const allEvents = eventsRepository.findAll();
  const events = allEvents.filter((e) => attending[e.id]);

  const ics = buildCalendar(
    `pandaplan – ${person.name}`,
    events,
    categoriesRepository.findAll(),
    personsRepository.findAll(),
    attendanceRepository.findAll()
  );
  return { ics, personName: person.name };
}

module.exports = { buildFullCalendarIcs, buildPersonCalendarIcs };
