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
    // Pandaplan stores event times as local wall-clock times. Explicitly attach
    // the configured IANA timezone so calendar clients do not interpret them
    // as UTC (and so CET/CEST is handled correctly throughout the year).
    lines.push(`DTSTART;TZID=${config.EVENT_TIMEZONE}:${icsDateTime(ev.date, ev.startTime)}`);
    lines.push(`DTEND;TZID=${config.EVENT_TIMEZONE}:${icsDateTime(ev.date, ev.endTime || ev.startTime)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${icsDateOnly(ev.date)}`);
    lines.push(`DTEND;VALUE=DATE:${addDaysToIsoDate(ev.date, 1)}`);
  }

  const timeRange = ev.startTime ? `${ev.startTime}${ev.endTime ? '–' + ev.endTime : ''}` : '';
  const summary = categoryName ? `${categoryName}${ev.location ? ' · ' + ev.location : ''}` : (ev.location || 'pandaplan event');
  lines.push(`SUMMARY:${icsEscape(summary)}`);
  if (ev.location) lines.push(`LOCATION:${icsEscape(ev.location)}`);
  lines.push(`DESCRIPTION:${icsEscape(buildDescription(ev, categoryName, timeRange, attendeeNames))}`);
  if (categoryName) lines.push(`CATEGORIES:${icsEscape(categoryName)}`);
  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
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
  addDaysToIsoDate,
  buildDescription,
  buildVEvent,
  buildCalendar,
};
