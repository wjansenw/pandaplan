const express = require('express');
const AppError = require('../errors');
const { getDb } = require('../db/connection');
const teamService = require('../services/teamService');
const { generateId } = require('../utils/id');
const { fetchUrl, parseIcs } = require('../utils/icsImport');
const router = express.Router({ mergeParams: true });

function rows(teamId) {
  return getDb().prepare(`SELECT e.id, e.category_id AS categoryId, e.subject, e.date, e.start_time AS startTime,
    e.end_time AS endTime, e.location, e.description FROM events e
    WHERE e.team_id = ? ORDER BY e.date, e.start_time`).all(teamId);
}
function validateCategory(teamId, categoryId) {
  if (categoryId == null || categoryId === '') return null;
  if (!getDb().prepare('SELECT 1 FROM categories WHERE id = ? AND team_id = ?').get(categoryId, teamId)) {
    throw new AppError(400, 'category does not belong to this team');
  }
  return categoryId;
}

router.get('/', (req, res) => res.json(rows(teamService.getBySlug(req.params.slug).id)));
router.post('/', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const categoryId = validateCategory(team.id, req.body.categoryId);
  const id = generateId();
  getDb().prepare(`INSERT INTO events (id, team_id, category_id, subject, date, start_time, end_time, location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, team.id, categoryId, req.body.subject || '', req.body.date, req.body.startTime || '', req.body.endTime || '', req.body.location || '', req.body.description || '');
  res.status(201).json(rows(team.id));
});

router.post('/recurring', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const body = req.body || {};
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const startDate = typeof body.startDate === 'string' ? body.startDate : '';
  const endDate = typeof body.endDate === 'string' ? body.endDate : '';
  const startTime = typeof body.startTime === 'string' ? body.startTime : '';
  const endTime = typeof body.endTime === 'string' ? body.endTime : '';
  const weekdays = Array.isArray(body.weekdays) ? [...new Set(body.weekdays.map(Number))] : [];
  if (!subject) throw new AppError(400, 'subject is required');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(startDate) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(endDate)) throw new AppError(400, 'start and end dates are required');
  if (startDate > endDate) throw new AppError(400, 'start date must be before or equal to end date');
  if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(startTime) || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(endTime)) throw new AppError(400, 'valid start and end times are required');
  if (!weekdays.length || weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new AppError(400, 'at least one weekday is required');
  const categoryId = validateCategory(team.id, body.categoryId);
  const db = getDb();
  const dates = [];
  for (let cursor = new Date(`${startDate}T00:00:00Z`); cursor <= new Date(`${endDate}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    if (weekdays.includes(cursor.getUTCDay())) dates.push(cursor.toISOString().slice(0, 10));
  }
  if (!dates.length) throw new AppError(400, 'no matching dates in the selected range');
  const insert = db.prepare(`INSERT INTO events (id, team_id, category_id, subject, date, start_time, end_time, location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => {
    dates.forEach(date => insert.run(generateId(), team.id, categoryId, subject, date, startTime, endTime, body.location || '', body.description || ''));
  })();
  res.status(201).json({ created: dates.length, events: rows(team.id) });
});

router.post('/import-ics', async (req, res, next) => {
  try {
    const team = teamService.getBySlug(req.params.slug);
    const url = typeof req.body.url === 'string' ? req.body.url.trim() : '';
    if (!url) return res.status(400).json({ error: 'ICS feed URL is required' });
    const locationContains = typeof req.body.locationContains === 'string' ? req.body.locationContains.trim() : '';
    const locationCategoryId = validateCategory(team.id, req.body.locationCategoryId);
    const fallbackCategoryId = validateCategory(team.id, req.body.fallbackCategoryId);
    const imported = parseIcs(await fetchUrl(url));
    const db = getDb();
    const exists = db.prepare(`SELECT 1 FROM events WHERE team_id = ? AND subject = ? AND date = ? AND start_time = ? AND end_time = ? AND location = ? LIMIT 1`);
    const insert = db.prepare(`INSERT INTO events (id, team_id, category_id, subject, date, start_time, end_time, location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')`);
    let created = 0;
    let skipped = 0;
    db.transaction(() => {
      for (const event of imported) {
        if (exists.get(team.id, event.subject, event.date, event.startTime, event.endTime, event.location)) {
          skipped++;
          continue;
        }
        const matchesLocation = locationContains && event.location.toLocaleLowerCase().includes(locationContains.toLocaleLowerCase());
        const categoryId = matchesLocation ? locationCategoryId : fallbackCategoryId;
        insert.run(generateId(), team.id, categoryId, event.subject, event.date, event.startTime, event.endTime, event.location);
        created++;
      }
    })();
    res.status(201).json({ created, skipped, found: imported.length, events: rows(team.id) });
  } catch (error) {
    next(error);
  }
});
router.put('/:eventId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const categoryId = validateCategory(team.id, req.body.categoryId);
  getDb().prepare(`UPDATE events SET category_id = ?, subject = ?, date = ?, start_time = ?, end_time = ?, location = ?, description = ?
    WHERE id = ? AND team_id = ?`).run(categoryId, req.body.subject || '', req.body.date, req.body.startTime || '', req.body.endTime || '', req.body.location || '', req.body.description || '', req.params.eventId, team.id);
  res.json(rows(team.id));
});
router.delete('/:eventId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  getDb().prepare('DELETE FROM events WHERE id = ? AND team_id = ?').run(req.params.eventId, team.id);
  res.json(rows(team.id));
});
module.exports = router;
