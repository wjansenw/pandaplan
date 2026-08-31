const ical = require('ical-generator');
const { getVtimezoneComponent } = require('@touch4it/ical-timezones');
const { DateTime } = require('luxon');
const config = require('../config');

function icsEscape(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
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

function localDateTime(date, time) {
  return DateTime.fromISO(`${date}T${time}`, {
    zone: config.EVENT_TIMEZONE,
  });
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

  const calendar = ical({
    name: calName,
    prodId: '//pandaplan//EN',
    method: 'PUBLISH',
    timezone: {
      name: config.EVENT_TIMEZONE,
      generator: getVtimezoneComponent,
    },
  });

  events.forEach((ev) => {
    const categoryName = catName(ev.categoryId);
    const attendeeNames = attendeesFor(ev.id);
    const timeRange = ev.startTime
      ? `${ev.startTime}${ev.endTime ? '–' + ev.endTime : ''}`
      : '';
    const summary = categoryName
      ? `${categoryName}${ev.location ? ' · ' + ev.location : ''}`
      : (ev.location || 'pandaplan event');

    const eventData = {
      id: ev.id,
      uid: `${ev.id}@pandaplan`,
      summary,
      description: buildDescription(ev, categoryName, timeRange, attendeeNames),
      location: ev.location || undefined,
      categories: categoryName ? [{ name: categoryName }] : [],
      status: 'CONFIRMED',
      transparency: 'OPAQUE',
      sequence: 0,
      stamp: DateTime.utc(),
      lastModified: DateTime.utc(),
      timezone: config.EVENT_TIMEZONE,
    };

    if (ev.startTime) {
      eventData.start = localDateTime(ev.date, ev.startTime);
      eventData.end = localDateTime(ev.date, ev.endTime || ev.startTime);
    } else {
      eventData.start = localDateTime(ev.date, '00:00');
      eventData.end = localDateTime(ev.date, '00:00').plus({ days: 1 });
      eventData.allDay = true;
    }

    calendar.createEvent(eventData);
  });

  return calendar.toString();
}

module.exports = {
  icsEscape,
  localDateTime,
  buildDescription,
  buildCalendar,
};
