const assert = require('assert');
const test = require('node:test');

const { buildCalendar, localDateTime } = require('../../src/utils/ics');

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

test('Luxon interprets Brussels winter time as CET', () => {
  const value = localDateTime('2026-01-15', '19:00');
  assert.strictEqual(value.zoneName, 'Europe/Brussels');
  assert.strictEqual(value.offset, 60);
  assert.strictEqual(value.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'"), '20260115T180000Z');
});

test('Luxon interprets Brussels summer time as CEST', () => {
  const value = localDateTime('2026-07-15', '19:00');
  assert.strictEqual(value.zoneName, 'Europe/Brussels');
  assert.strictEqual(value.offset, 120);
  assert.strictEqual(value.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'"), '20260715T170000Z');
});

test('August CEST event is exported with Brussels timezone information', () => {
  const ics = buildCalendar(
    'pandaplan',
    [eventFor('2026-08-17', '17:30', '19:00')],
    [],
    [],
    {}
  );

  assert.match(ics, /BEGIN:VTIMEZONE/);
  assert.match(ics, /TZID:Europe\/Brussels/);
  assert.match(ics, /BEGIN:DAYLIGHT/);
  assert.match(ics, /TZOFFSETTO:\+0200/);
  assert.match(ics, /TZNAME:CEST/);
  assert.match(ics, /BEGIN:STANDARD/);
  assert.match(ics, /TZOFFSETTO:\+0100/);
  assert.match(ics, /TZNAME:CET/);
  assert.match(ics, /DTSTART;TZID=Europe\/Brussels:20260817T173000/);
  assert.match(ics, /DTEND;TZID=Europe\/Brussels:20260817T190000/);
  assert.match(ics, /STATUS:CONFIRMED/);
  assert.match(ics, /TRANSP:OPAQUE/);
  assert.match(ics, /SEQUENCE:0/);
});

test('CET event is exported with the same local wall-clock time', () => {
  const ics = buildCalendar(
    'pandaplan',
    [eventFor('2026-01-15', '19:00', '21:00')],
    [],
    [],
    {}
  );

  assert.match(ics, /DTSTART;TZID=Europe\/Brussels:20260115T190000/);
  assert.match(ics, /DTEND;TZID=Europe\/Brussels:20260115T210000/);
});

test('all-day events remain date-only', () => {
  const ics = buildCalendar(
    'pandaplan',
    [{ id: 124, date: '2026-08-17', location: '', description: '' }],
    [],
    [],
    {}
  );

  assert.match(ics, /DTSTART;VALUE=DATE:20260817/);
  assert.match(ics, /DTEND;VALUE=DATE:20260818/);
});
