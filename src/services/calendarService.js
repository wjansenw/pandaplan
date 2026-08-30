const personsRepository = require('../repositories/personsRepository');
const categoriesRepository = require('../repositories/categoriesRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const { getDb } = require('../db/connection');
const { buildCalendar } = require('../utils/ics');
const teamsRepository = require('../repositories/teamsRepository');

// These feeds are unauthenticated by design (external calendar apps can't
// send our session cookie), so the token itself is the only thing standing
// between "unknown caller" and "this team's/person's schedule" — always
// resolve through findByCalendarToken, never by slug or person id.

function buildTeamCalendarIcs(token) {
  const team = teamsRepository.findByCalendarToken(token);
  if (!team) return null;
  const db = getDb();
  const events = db.prepare(`SELECT id, team_id AS teamId, category_id AS categoryId, date, start_time AS startTime, end_time AS endTime, location, description FROM events WHERE team_id = ? ORDER BY date, start_time`).all(team.id);
  const categories = categoriesRepository.findByTeam(team.id);
  return { ics: buildCalendar(`pandaplan – ${team.name}`, events, categories, personsRepository.findAll(), attendanceRepository.findAll()) };
}

function buildPersonCalendarIcs(token) {
  const person = personsRepository.findByCalendarToken(token);
  if (!person) return null;
  const db = getDb();
  const events = db.prepare(`
    SELECT DISTINCT e.id, e.team_id AS teamId, e.category_id AS categoryId, e.date, e.start_time AS startTime,
      e.end_time AS endTime, e.location, e.description
    FROM events e JOIN team_memberships tm ON tm.team_id = e.team_id AND tm.person_id = ?
    LEFT JOIN attendance a ON a.event_id = e.id AND a.person_id = ?
    LEFT JOIN staff_assignments sa ON sa.event_id = e.id AND sa.person_id = ?
    WHERE a.status = 'yes' OR sa.person_id IS NOT NULL ORDER BY e.date, e.start_time
  `).all(person.id, person.id, person.id);
  const ics = buildCalendar(`pandaplan – ${person.name}`, events, categoriesRepository.findAll(), personsRepository.findAll(), attendanceRepository.findAll());
  return { ics, personName: person.name };
}

module.exports = { buildTeamCalendarIcs, buildPersonCalendarIcs };
