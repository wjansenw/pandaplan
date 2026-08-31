const assert = require('assert');
const test = require('node:test');

// ... existing integration test helpers and imports remain unchanged ...

// The calendar export deliberately uses the event's configured IANA timezone
// and preserves the local wall-clock time. The VTIMEZONE component tells
// calendar clients how CET/CEST map to UTC.
test('Pandaplan event creation and ICS export preserve CET and CEST local times', async () => {
  const team = teamService.create({
    name: 'Calendar integration test',
    slug: 'calendar-integration-test',
    description: '',
  });

  const cetEvent = createEvent(team.slug, {
    subject: 'CET training',
    date: '2026-01-15',
    startTime: '19:00',
    endTime: '21:00',
    location: 'CET test location',
    description: 'Created by the Pandaplan event endpoint',
  });

  const cestEvent = createEvent(team.slug, {
    subject: 'CEST training',
    date: '2026-07-15',
    startTime: '19:00',
    endTime: '21:00',
    location: 'CEST test location',
    description: 'Created by the Pandaplan event endpoint',
  });

  assert.strictEqual(cetEvent.date, '2026-01-15');
  assert.strictEqual(cetEvent.startTime, '19:00');
  assert.strictEqual(cetEvent.endTime, '21:00');
  assert.strictEqual(cestEvent.date, '2026-07-15');
  assert.strictEqual(cestEvent.startTime, '19:00');
  assert.strictEqual(cestEvent.endTime, '21:00');

  const ics = await exportTeamCalendar(team.calendarToken);

  // The events are emitted as Brussels local times with TZID. This is the
  // representation used by the new ical-generator implementation; the
  // accompanying VTIMEZONE component defines CET/CEST and therefore allows
  // Google Calendar to convert these times correctly.
  assert.match(ics, /TZID=Europe\/Brussels:20260115T190000/);
  assert.match(ics, /TZID=Europe\/Brussels:20260115T210000/);
  assert.match(ics, /TZID=Europe\/Brussels:20260715T190000/);
  assert.match(ics, /TZID=Europe\/Brussels:20260715T210000/);

  assert.match(ics, /LOCATION:CET test location/);
  assert.match(ics, /LOCATION:CEST test location/);

  // Verify the generated timezone contains both Brussels DST regimes.
  assert.match(ics, /BEGIN:VTIMEZONE/);
  assert.match(ics, /TZID:Europe\/Brussels/);
  assert.match(ics, /TZNAME:CEST/);
  assert.match(ics, /TZNAME:CET/);
});
