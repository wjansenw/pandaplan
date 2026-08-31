const config = require('../config');

function icsEscape(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545 line folding: continuation lines start with a single space.
function foldLine(line) {
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    out += '\r\n ' + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return out;
}

function icsDateOnly(dateStr) {
  return dateStr.replace(/-/g, '');
}

// Convert a Pandaplan local wall-clock time in EVENT_TIMEZONE to an absolute
// UTC instant. Using the configured IANA timezone makes the conversion honor
// both CET and CEST without depending on the server's local timezone.
function localDateTimeToUtc(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = new Date(target);

  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: config.EVENT_TIMEZONE,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(instant).reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

    const asUtc = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second)
    );
    const offset = asUtc - instant.getTime();
    const next = new Date(target - offset);
    if (next.getTime() === instant.getTime()) break;
    instant = next;
  }

  return instant.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function icsDateTime(dateStr, timeStr) {
  const [hh, mm] = timeStr.split(':');
  return `${icsDateOnly(dateStr)}T${hh}${mm}00`;
}

function addDaysToIsoDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return icsDateOnly(d.toISOString().slice(0, 10));
}

function buildDescription(ev, categoryName, timeRange, attendeeNames) {
  const sections = [];
  const details = [];
  if (categoryName) details.push(categoryName);
  if (timeRange) details.push(timeRange);
  if (ev.location) details.push(ev.location);
  if (details.length) sections.push(details.join('  •  '));
  if (ev.description) sections.push(ev.description);
  sections.push(
    attendeeNames.length
      ? `Attending (${attendeeNames.length}): ${attendeeNames.join(', ')}`
      : 'Attending: no one registered yet'
  );
  return sections.join('\n\n');
}

function buildVEvent(ev, categoryName, attendeeNames) {
  const lines = [];
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${ev.id}@pandaplan`);
  lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

  if (ev.startTime) {
    // Export an absolute UTC instant. This avoids clients interpreting a
    // TZID without a matching VTIMEZONE differently.
    lines.push(`DTSTART:${localDateTimeToUtc(ev.date, ev.startTime)}`);
    lines.push(`DTEND:${localDateTimeToUtc(ev.date, ev.endTime || ev.startTime)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${icsDateOnly(ev.date)}`);
    lines.push(`DTEND;VALUE=DATE:${addDaysToIsoDate(ev.date, 1)}`);
  }

  const timeRange = ev.startTime ? `${ev.startTime}${ev.endTime ? '–' + ev.endTime : ''}` : '';
  const summary = categoryName
    ? `${categoryName}${ev.location ? ' · ' + ev.location : ''}`
    : (ev.location || 'pandaplan event');
  lines.push(`SUMMARY:${icsEscape(summary)}`);
  if (ev.location) lines.push(`LOCATION:${icsEscape(ev.location)}`);
  lines.push(`DESCRIPTION:${icsEscape(buildDescription(ev, categoryName, timeRange, attendeeNames))}`);
  if (categoryName) lines.push(`CATEGORIES:${icsEscape(categoryName)}`);
  lines.push('STATUS:CONFIRMED');
  lines.push('TRANSP:OPAQUE');
  lines.push('SEQUENCE:0');
  lines.push(`LAST-MODIFIED:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

function buildBrusselsVTimezone() {
  if (config.EVENT_TIMEZONE !== 'Europe/Brussels') return [];

  return [
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Brussels',
    'X-LIC-LOCATION:Europe/Brussels',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
}

function buildCalendar(calName, events, categories, persons, attendanceByPerson) {
  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || '';
  const attendeesFor = (eventId) =>
    persons
      .filter((p) => attendanceByPerson[p.id] && attendanceByPerson[p.id][eventId])
      .map((p) => {
        const entry = attendanceByPerson[p.id][eventId];
        const note = (entry && entry.note) || '';
        return note ? `${p.name} (${note})` : p.name;
      });

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//pandaplan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine(`X-WR-CALNAME:${icsEscape(calName)}`),
    `X-WR-TIMEZONE:${config.EVENT_TIMEZONE}`,
    ...buildBrusselsVTimezone(),
    ...events.map((ev) => buildVEvent(ev, catName(ev.categoryId), attendeesFor(ev.id))),
    'END:VCALENDAR',
  ];
  return body.join('\r\n') + '\r\n';
}

module.exports = {
  icsEscape,
  foldLine,
  icsDateOnly,
  icsDateTime,
  localDateTimeToUtc,
  addDaysToIsoDate,
  buildDescription,
  buildVEvent,
  buildBrusselsVTimezone,
  buildCalendar,
};
