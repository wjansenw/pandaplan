const assert = require('assert');
const test = require('node:test');

// The production config defaults to Europe/Brussels. These tests verify that
// local Pandaplan wall-clock times are exported as the corresponding absolute
// UTC instants, with the IANA zone providing the correct CET/CEST rules.
const { buildVEvent, buildCalendar, localDateTimeToUtc } = require('../../src/utils/ics');

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

test('Europe/Brussels CET conversion: 19:00 becomes 18:00 UTC', () => {
  assert.strictEqual(localDateTimeToUtc('2026-01-15', '19:00'), '20260115T180000Z');

  const ics = buildVEvent(eventFor('2026-01-15'), '', []);
  assert.match(ics, /DTSTART:20260115T180000Z/);
  assert.match(ics, /DTEND:20260115T200000Z/);
});

test('Europe/Brussels CEST conversion: 19:00 becomes 17:00 UTC', () => {
  assert.strictEqual(localDateTimeToUtc('2026-07-15', '19:00'), '20260715T170000Z');

  const ics = buildVEvent(eventFor('2026-07-15'), '', []);
  assert.match(ics, /DTSTART:20260715T170000Z/);
  assert.match(ics, /DTEND:20260715T190000Z/);
});

test('ICS calendar declares Europe/Brussels timezone', () => {
  const ics = buildCalendar(
    'pandaplan',
    [eventFor('2026-07-15')],
    [],
    [],
    {}
  );

  assert.match(ics, /X-WR-TIMEZONE:Europe\/Brussels/);
});
