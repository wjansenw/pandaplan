const { default: ical } = require('ical-generator');
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

function formatRole(role) {
  return String(role || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildDescription(ev, categoryName, timeRange, attendance, staff) {
  const sections = [];
  const details = [];
  if (categoryName) details.push(categoryName);
  if (timeRange) details.push(timeRange);
  if (ev.location) details.push(ev.location);
  if (details.length) sections.push(details.join('  •  '));
  if (ev.description) sections.push(ev.description);

  const attendanceSections = [
    ['Attending', attendance.yes],
    ['Maybe', attendance.maybe],
    ['Not attending', attendance.no],
  ];
  const attendanceText = attendanceSections
    .filter(([, names]) => names.length)
    .map(([label, names]) => `${label}:\n${names.map((name) => `• ${name}`).join('\n')}`)
    .join('\n\n');
  if (attendanceText) sections.push(attendanceText);

  const staffText = Object.entries(staff)
    .filter(([, names]) => names.length)
    .map(([role, names]) => `${formatRole(role)}:\n${names.map((name) => `• ${name}`).join('\n')}`)
    .join('\n\n');
  if (staffText) sections.push(`Staff:\n${staffText}`);

  return sections.join('\n\n');
}

function localDateTime(date, time) {
  return DateTime.fromISO(`${date}T${time}`, {
    zone: config.EVENT_TIMEZONE,
  });
}

function buildCalendar(calName, events, categories, persons, attendanceByPerson, staffByEvent = {}) {
  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || '';
  const attendeesFor = (eventId) => {
    const result = { yes: [], maybe: [], no: [] };
    persons.forEach((p) => {
      const entry = attendanceByPerson[p.id] && attendanceByPerson[p.id][eventId];
      if (!entry || !result[entry.status]) return;
      const note = entry.note || '';
      result[entry.status].push(note ? `${p.name} (${note})` : p.name);
    });
    return result;
  };
  const staffFor = (eventId) => {
    const assignments = staffByEvent[eventId] || {};
    return Object.fromEntries(
      Object.entries(assignments).map(([role, personIds]) => [
        role,
        personIds.map((personId) => {
          const person = persons.find((p) => p.id === personId);
          return person ? person.name : personId;
        }),
      ])
    );
  };

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
    const attendance = attendeesFor(ev.id);
    const staff = staffFor(ev.id);
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
      description: buildDescription(ev, categoryName, timeRange, attendance, staff),
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
