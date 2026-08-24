const personsRepository = require('../repositories/personsRepository');
const categoriesRepository = require('../repositories/categoriesRepository');
const eventsRepository = require('../repositories/eventsRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const { getDb } = require('../db/connection');
const { buildCalendar } = require('../utils/ics');
const teamsRepository = require('../repositories/teamsRepository');

function buildFullCalendarIcs() {
  return buildCalendar('pandaplan', eventsRepository.findAll(), categoriesRepository.findAll(), personsRepository.findAll(), attendanceRepository.findAll());
}

function buildTeamCalendarIcs(slug) {
  const team = teamsRepository.findBySlug(slug);
  if (!team) return null;
  const db = getDb();
  const events = db.prepare(`SELECT id, team_id AS teamId, category_id AS categoryId, date, start_time AS startTime, end_time AS endTime, location, description FROM events WHERE team_id = ? ORDER BY date, start_time`).all(team.id);
  const categories = categoriesRepository.findByTeam(team.id);
  return { ics: buildCalendar(`pandaplan – ${team.name}`, events, categories, personsRepository.findAll(), attendanceRepository.findAll()), slug: team.slug };
}

function buildPersonCalendarIcs(personId) {
  const person = personsRepository.findById(personId);
  if (!person) return null;
  const db = getDb();
  const events = db.prepare(`
    SELECT DISTINCT e.id, e.team_id AS teamId, e.category_id AS categoryId, e.date, e.start_time AS startTime,
      e.end_time AS endTime, e.location, e.description
    FROM events e JOIN team_memberships tm ON tm.team_id = e.team_id AND tm.person_id = ?
    LEFT JOIN attendance a ON a.event_id = e.id AND a.person_id = ?
    LEFT JOIN staff_assignments sa ON sa.event_id = e.id AND sa.person_id = ?
    WHERE a.status = 'yes' OR sa.person_id IS NOT NULL ORDER BY e.date, e.start_time
  `).all(personId, personId, personId);
  const ics = buildCalendar(`pandaplan – ${person.name}`, events, categoriesRepository.findAll(), personsRepository.findAll(), attendanceRepository.findAll());
  return { ics, personName: person.name };
}

module.exports = { buildFullCalendarIcs, buildTeamCalendarIcs, buildPersonCalendarIcs };
