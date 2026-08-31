const assert = require('assert');
const test = require('node:test');

const teamService = require('../../src/services/teamService');
const calendarService = require('../../src/services/calendarService');
const { buildCalendar } = require('../../src/utils/ics');
const { getDb } = require('../../src/db/connection');
const { generateId } = require('../../src/utils/id');

function createTestTeam() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return teamService.create({
    name: `Calendar integration test ${suffix}`,
    slug: `calendar-integration-${suffix}`,
    description: '',
  });
}

function createEvent(teamId, event) {
  const id = generateId();
  getDb().prepare(`
    INSERT INTO events (
      id, team_id, category_id, subject, date, start_time, end_time, location, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    teamId,
    event.categoryId || null,
    event.subject || '',
    event.date,
    event.startTime || '',
    event.endTime || '',
    event.location || '',
    event.description || ''
  );
  return getDb().prepare(`
    SELECT id, team_id AS teamId, category_id AS categoryId, subject, date,
      start_time AS startTime, end_time AS endTime, location, description
    FROM events WHERE id = ?
  `).get(id);
}

test('Pandaplan event creation and ICS export preserve CET and CEST local times', () => {
  const team = createTestTeam();

  try {
    const cetEvent = createEvent(team.id, {
      subject: 'CET training',
      date: '2026-01-15',
      startTime: '19:00',
      endTime: '21:00',
      location: 'CET test location',
      description: 'Created by the calendar integration test',
    });

    const cestEvent = createEvent(team.id, {
      subject: 'CEST training',
      date: '2026-07-15',
      startTime: '19:00',
      endTime: '21:00',
      location: 'CEST test location',
      description: 'Created by the calendar integration test',
    });

    assert.strictEqual(cetEvent.date, '2026-01-15');
    assert.strictEqual(cetEvent.startTime, '19:00');
    assert.strictEqual(cetEvent.endTime, '21:00');
    assert.strictEqual(cestEvent.date, '2026-07-15');
    assert.strictEqual(cestEvent.startTime, '19:00');
    assert.strictEqual(cestEvent.endTime, '21:00');

    const result = calendarService.buildTeamCalendarIcs(team.calendarToken);
    assert.ok(result);
    const ics = result.ics;

    assert.match(ics, /DTSTART;TZID=Europe\/Brussels:20260115T190000/);
    assert.match(ics, /DTEND;TZID=Europe\/Brussels:20260115T210000/);
    assert.match(ics, /DTSTART;TZID=Europe\/Brussels:20260715T190000/);
    assert.match(ics, /DTEND;TZID=Europe\/Brussels:20260715T210000/);

    assert.match(ics, /LOCATION:CET test location/);
    assert.match(ics, /LOCATION:CEST test location/);
    assert.match(ics, /BEGIN:VTIMEZONE/);
    assert.match(ics, /TZID:Europe\/Brussels/);
    assert.match(ics, /TZNAME:CEST/);
    assert.match(ics, /TZNAME:CET/);

    assert.ok(ics.includes(`UID:${cetEvent.id}@pandaplan`));
    assert.ok(ics.includes(`UID:${cestEvent.id}@pandaplan`));
  } finally {
    const db = getDb();
    db.transaction(() => {
      db.prepare('DELETE FROM attendance WHERE event_id IN (SELECT id FROM events WHERE team_id = ?)').run(team.id);
      db.prepare('DELETE FROM staff_assignments WHERE event_id IN (SELECT id FROM events WHERE team_id = ?)').run(team.id);
      db.prepare('DELETE FROM events WHERE team_id = ?').run(team.id);
      db.prepare('DELETE FROM team_membership_roles WHERE team_id = ?').run(team.id);
      db.prepare('DELETE FROM team_memberships WHERE team_id = ?').run(team.id);
      db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
    })();
  }
});

test('ICS attendee list only includes people with yes attendance status', () => {
  const event = {
    id: 'attendance-test-event',
    categoryId: null,
    date: '2026-08-31',
    startTime: '19:00',
    endTime: '21:00',
    location: 'Attendance test location',
    description: '',
  };
  const persons = [
    { id: 'person-yes', name: 'Alice Attending' },
    { id: 'person-no', name: 'Bob Not Attending' },
    { id: 'person-unknown', name: 'Charlie Unknown' },
  ];
  const attendance = {
    'person-yes': { [event.id]: { status: 'yes', note: '' } },
    'person-no': { [event.id]: { status: 'no', note: 'Unavailable' } },
    'person-unknown': { [event.id]: { status: 'maybe', note: 'Not decided' } },
  };

  const ics = buildCalendar('Attendance test', [event], [], persons, attendance);

  assert.match(ics, /Attending \(1\): Alice Attending/);
  assert.doesNotMatch(ics, /Bob Not Attending/);
  assert.doesNotMatch(ics, /Charlie Unknown/);
});
