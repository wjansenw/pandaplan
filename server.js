const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.jsonl');
const PORT = process.env.PORT || 3000;

const CATEGORY_COLORS = ['#4F7942', '#B5503F', '#B8933F', '#4A6FA5', '#7B5EA7', '#A34F72', '#3A6B6E', '#8C6239'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Fixed role vocabulary. "participant" is the ordinary attendee role;
// Coach, Assistant-Coach, Trainer are staff roles. A person can hold any combination.
const PARTICIPANT_ROLE = 'participant';
const STAFF_ROLE_IDS = ['coach', 'assistant-coach', 'trainer'];
const ALL_ROLE_IDS = [PARTICIPANT_ROLE, ...STAFF_ROLE_IDS];

// Attendance status: yes, no, maybe, unknown (undefined)
const ATTENDANCE_STATUS = ['yes', 'no', 'maybe'];

function sanitizeRoles(input, allowed) {
  if (!Array.isArray(input)) return null;
  const set = new Set(input.filter((r) => allowed.includes(r)));
  return Array.from(set);
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- logging -------------------------------------------------

function logAction(req, action, details) {
  const hashedIp = hashIp(req.ip || req.connection.remoteAddress || 'unknown');
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    hashedIp,
    action,
    details,
  };
  try {
    fs.appendFileSync(LOGS_FILE, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

// ---- storage helpers -------------------------------------------------

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      persons: [], categories: [], events: [], attendance: {}, staffAssignments: {}
    }, null, 2));
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  if (!Array.isArray(db.persons)) db.persons = [];
  if (!Array.isArray(db.categories)) db.categories = [];
  if (!Array.isArray(db.events)) db.events = [];
  if (typeof db.attendance !== 'object' || db.attendance === null) db.attendance = {};
  if (typeof db.staffAssignments !== 'object' || db.staffAssignments === null) db.staffAssignments = {};
  
  // Backward compatibility
  db.persons.forEach((p) => {
    const roles = sanitizeRoles(p.roles, ALL_ROLE_IDS);
    p.roles = roles && roles.length ? roles : [PARTICIPANT_ROLE];
  });
  db.categories.forEach((c) => {
    c.requiredStaffRoles = sanitizeRoles(c.requiredStaffRoles, STAFF_ROLE_IDS) || [];
  });
  return db;
}

// serialize writes so concurrent requests can't clobber each other
let writeQueue = Promise.resolve();
function writeDb(mutateFn) {
  writeQueue = writeQueue.then(() => {
    const db = readDb();
    const result = mutateFn(db);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return result;
  });
  return writeQueue;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- ics generation -------------------------------------------------------

function icsEscape(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

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
    lines.push(`DTSTART:${icsDateTime(ev.date, ev.startTime)}`);
    lines.push(`DTEND:${icsDateTime(ev.date, ev.endTime || ev.startTime)}`);
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
    ...events.map((ev) => buildVEvent(ev, catName(ev.categoryId), attendeesFor(ev.id))),
    'END:VCALENDAR',
  ];
  return body.join('\r\n') + '\r\n';
}

// ---- state -------------------------------------------------------------

app.get('/api/state', (req, res) => {
  const db = readDb();
  res.json({ 
    persons: db.persons, 
    categories: db.categories, 
    events: db.events,
    staffAssignments: db.staffAssignments 
  });
});

// ---- persons -------------------------------------------------------------

app.post('/api/persons', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });
  const roles = req.body.roles === undefined
    ? [PARTICIPANT_ROLE]
    : (sanitizeRoles(req.body.roles, ALL_ROLE_IDS) || []);
  if (!roles.length) return res.status(400).json({ error: 'at least one role is required' });
  const persons = await writeDb((db) => {
    db.persons.push({ id: uid(), name, roles });
    return db.persons;
  });
  logAction(req, 'create_person', { name, roles });
  res.json({ persons });
});

app.put('/api/persons/:id', async (req, res) => {
  const { id } = req.params;
  if (req.body.roles !== undefined) {
    const roles = sanitizeRoles(req.body.roles, ALL_ROLE_IDS);
    if (!roles || !roles.length) return res.status(400).json({ error: 'at least one role is required' });
  }
  const persons = await writeDb((db) => {
    const person = db.persons.find((p) => p.id === id);
    if (person) {
      if (typeof req.body.name === 'string' && req.body.name.trim()) person.name = req.body.name.trim();
      if (req.body.roles !== undefined) person.roles = sanitizeRoles(req.body.roles, ALL_ROLE_IDS);
    }
    return db.persons;
  });
  logAction(req, 'update_person', { personId: id, changes: req.body });
  res.json({ persons });
});

app.delete('/api/persons/:id', async (req, res) => {
  const { id } = req.params;
  const persons = await writeDb((db) => {
    db.persons = db.persons.filter((p) => p.id !== id);
    delete db.attendance[id];
    Object.keys(db.staffAssignments).forEach(eventId => {
      const assignments = db.staffAssignments[eventId];
      Object.keys(assignments).forEach(role => {
        if (assignments[role] === id) delete assignments[role];
      });
    });
    return db.persons;
  });
  logAction(req, 'delete_person', { personId: id });
  res.json({ persons });
});

// ---- categories -------------------------------------------------------------

app.post('/api/categories', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });
  const requiredStaffRoles = sanitizeRoles(req.body.requiredStaffRoles, STAFF_ROLE_IDS) || [];
  const categories = await writeDb((db) => {
    const color = CATEGORY_COLORS[db.categories.length % CATEGORY_COLORS.length];
    db.categories.push({ id: uid(), name, color, requiredStaffRoles });
    return db.categories;
  });
  logAction(req, 'create_category', { name, requiredStaffRoles });
  res.json({ categories });
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const categories = await writeDb((db) => {
    const cat = db.categories.find((c) => c.id === id);
    if (cat && req.body.requiredStaffRoles !== undefined) {
      cat.requiredStaffRoles = sanitizeRoles(req.body.requiredStaffRoles, STAFF_ROLE_IDS) || [];
    }
    return db.categories;
  });
  logAction(req, 'update_category', { categoryId: id, changes: req.body });
  res.json({ categories });
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const result = await writeDb((db) => {
    db.categories = db.categories.filter((c) => c.id !== id);
    db.events.forEach((e) => {
      if (e.categoryId === id) e.categoryId = null;
    });
    return { categories: db.categories, events: db.events };
  });
  logAction(req, 'delete_category', { categoryId: id });
  res.json(result);
});

// ---- events -------------------------------------------------------------

function validateEventBody(body) {
  const { date, startTime, endTime, location, description, categoryId } = body;
  if (!date || !DATE_RE.test(date)) return 'date must be YYYY-MM-DD';
  if (startTime && !TIME_RE.test(startTime)) return 'startTime must be HH:MM';
  if (endTime && !TIME_RE.test(endTime)) return 'endTime must be HH:MM';
  if (startTime && endTime && endTime < startTime) return 'endTime must not be before startTime';
  return null;
}

app.post('/api/events', async (req, res) => {
  const err = validateEventBody(req.body);
  if (err) return res.status(400).json({ error: err });
  const { categoryId, date, startTime, endTime, location, description } = req.body;
  const events = await writeDb((db) => {
    db.events.push({
      id: uid(),
      categoryId: categoryId || null,
      date,
      startTime: startTime || '',
      endTime: endTime || '',
      location: (location || '').trim(),
      description: (description || '').trim(),
    });
    return db.events;
  });
  logAction(req, 'create_event', { date, location });
  res.json({ events });
});

app.put('/api/events/:id', async (req, res) => {
  const err = validateEventBody(req.body);
  if (err) return res.status(400).json({ error: err });
  const { id } = req.params;
  const { categoryId, date, startTime, endTime, location, description } = req.body;
  const events = await writeDb((db) => {
    const ev = db.events.find((e) => e.id === id);
    if (ev) {
      ev.categoryId = categoryId || null;
      ev.date = date;
      ev.startTime = startTime || '';
      ev.endTime = endTime || '';
      ev.location = (location || '').trim();
      ev.description = (description || '').trim();
    }
    return db.events;
  });
  logAction(req, 'update_event', { eventId: id });
  res.json({ events });
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const events = await writeDb((db) => {
    db.events = db.events.filter((e) => e.id !== id);
    Object.keys(db.attendance).forEach((personId) => {
      delete db.attendance[personId][id];
    });
    delete db.staffAssignments[id];
    return db.events;
  });
  logAction(req, 'delete_event', { eventId: id });
  res.json({ events });
});

// ---- attendance -------------------------------------------------------------

app.get('/api/attendance', (req, res) => {
  const db = readDb();
  res.json({ attendance: db.attendance });
});

app.get('/api/attendance/:personId', (req, res) => {
  const db = readDb();
  res.json({ attendance: db.attendance[req.params.personId] || {} });
});

const NOTE_MAX_LEN = 200;

app.put('/api/attendance/:personId/:eventId', async (req, res) => {
  const { personId, eventId } = req.params;
  const status = req.body.status; // 'yes', 'no', 'maybe', or undefined (unknown)
  const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, NOTE_MAX_LEN) : '';
  
  if (status && !ATTENDANCE_STATUS.includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  
  const attendance = await writeDb((db) => {
    if (!db.attendance[personId]) db.attendance[personId] = {};
    if (status) {
      db.attendance[personId][eventId] = { status, note };
    } else {
      delete db.attendance[personId][eventId];
    }
    return db.attendance[personId];
  });
  logAction(req, 'update_attendance', { personId, eventId, status });
  res.json({ attendance });
});

// ---- staff assignments -------------------------------------------------

app.get('/api/staffAssignments/:eventId', (req, res) => {
  const db = readDb();
  const { eventId } = req.params;
  res.json({ staffAssignments: db.staffAssignments[eventId] || {} });
});

app.put('/api/staffAssignments/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { role, personId } = req.body;
  
  if (!STAFF_ROLE_IDS.includes(role)) {
    return res.status(400).json({ error: 'invalid role' });
  }
  
  const staffAssignments = await writeDb((db) => {
    if (!db.staffAssignments[eventId]) db.staffAssignments[eventId] = {};
    if (personId) {
      // Verify person exists and has this role
      const person = db.persons.find(p => p.id === personId);
      if (!person || !person.roles.includes(role)) {
        throw new Error('Person does not have this role');
      }
      db.staffAssignments[eventId][role] = personId;
    } else {
      delete db.staffAssignments[eventId][role];
    }
    return db.staffAssignments[eventId] || {};
  });
  logAction(req, 'assign_staff', { eventId, role, personId });
  res.json({ staffAssignments });
});

// ---- calendar feeds (.ics) -------------------------------------------------

app.get('/calendar/all.ics', (req, res) => {
  const db = readDb();
  const ics = buildCalendar('pandaplan', db.events, db.categories, db.persons, db.attendance);
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', 'inline; filename="pandaplan.ics"');
  res.send(ics);
});

app.get('/calendar/person/:personId.ics', (req, res) => {
  const db = readDb();
  const person = db.persons.find((p) => p.id === req.params.personId);
  if (!person) return res.status(404).send('Unknown person');
  const attending = db.attendance[person.id] || {};
  const events = db.events.filter((e) => attending[e.id]);
  const ics = buildCalendar(`pandaplan – ${person.name}`, events, db.categories, db.persons, db.attendance);
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', `inline; filename="pandaplan-${person.name}.ics"`);
  res.send(ics);
});

app.listen(PORT, () => {
  ensureDb();
  console.log(`pandaplan listening on :${PORT}`);
});
