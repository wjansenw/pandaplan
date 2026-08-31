const assert = require('assert');
const test = require('node:test');

// The production config defaults to Europe/Brussels. These tests verify that
// Pandaplan keeps the entered wall-clock time and explicitly identifies the
// timezone, with the IANA zone providing the correct CET/CEST rules.
const { buildVEvent, buildCalendar } = require('../../src/utils/ics');

function eventFor(date, startTime = '19:00', endTime = '21:00') {
  return {
    id: 123,
    date,
    startTime,
    endTime,
    location: 'Sporthal',
    description: '',
  };
}

test('ICS export identifies Europe/Brussels for a CET event', () => {
  const ics = buildVEvent(eventFor('2026-01-15'), '', []);

  assert.match(ics, /DTSTART;TZID=Europe\/Brussels:20260115T190000/);
  assert.match(ics, /DTEND;TZID=Europe\/Brussels:20260115T210000/);
  assert.doesNotMatch(ics, /DTSTART:20260115T190000Z/);
});

test('ICS export identifies Europe/Brussels for a CEST event', () => {
  const ics = buildVEvent(eventFor('2026-07-15'), '', []);

  assert.match(ics, /DTSTART;TZID=Europe\/Brussels:20260715T190000/);
  assert.match(ics, /DTEND;TZID=Europe\/Brussels:20260715T210000/);
  assert.doesNotMatch(ics, /DTSTART:20260715T190000Z/);
});

test('ICS calendar declares its configured timezone', () => {
  const ics = buildCalendar(
    'pandaplan',
    [eventFor('2026-07-15')],
    [],
    [],
    {}
  );

  assert.match(ics, /X-WR-TIMEZONE:Europe\/Brussels/);
});
