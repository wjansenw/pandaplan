const assert = require('assert');
const test = require('node:test');

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

test('Europe/Brussels CET conversion', () => {
  assert.strictEqual(localDateTimeToUtc('2026-01-15', '19:00'), '20260115T180000Z');
  assert.strictEqual(localDateTimeToUtc('2026-01-15', '21:00'), '20260115T200000Z');
});

test('Europe/Brussels CEST conversion', () => {
  assert.strictEqual(localDateTimeToUtc('2026-07-15', '19:00'), '20260715T170000Z');
  assert.strictEqual(localDateTimeToUtc('2026-07-15', '21:00'), '20260715T190000Z');
});

test('August CEST event is exported as UTC', () => {
  const ics = buildVEvent(eventFor('2026-08-17', '17:30', '19:00'), '', []);

  assert.match(ics, /DTSTART:20260817T153000Z/);
  assert.match(ics, /DTEND:20260817T170000Z/);
  assert.match(ics, /STATUS:CONFIRMED/);
  assert.match(ics, /TRANSP:OPAQUE/);
  assert.match(ics, /SEQUENCE:0/);
});

test('calendar contains the Brussels VTIMEZONE definition', () => {
  const ics = buildCalendar(
    'pandaplan',
    [eventFor('2026-08-17', '17:30', '19:00')],
    [],
    [],
    {}
  );

  assert.match(ics, /BEGIN:VTIMEZONE/);
  assert.match(ics, /TZID:Europe\/Brussels/);
  assert.match(ics, /X-LIC-LOCATION:Europe\/Brussels/);
  assert.match(ics, /TZOFFSETFROM:\+0100/);
  assert.match(ics, /TZOFFSETTO:\+0200/);
  assert.match(ics, /TZNAME:CEST/);
  assert.match(ics, /TZOFFSETFROM:\+0200/);
  assert.match(ics, /TZOFFSETTO:\+0100/);
  assert.match(ics, /TZNAME:CET/);
  assert.match(ics, /RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU/);
  assert.match(ics, /RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU/);
});
