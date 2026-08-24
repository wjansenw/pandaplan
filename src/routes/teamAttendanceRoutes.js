const express = require('express');
const { getDb } = require('../db/connection');
const teamService = require('../services/teamService');
const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const rows = getDb().prepare(`SELECT a.person_id, a.event_id, a.status, a.note
    FROM attendance a JOIN events e ON e.id = a.event_id WHERE e.team_id = ?`).all(team.id);
  const result = {};
  rows.forEach((r) => ((result[r.person_id] || (result[r.person_id] = {}))[r.event_id] = { status: r.status, note: r.note }));
  res.json(result);
});

router.put('/:personId/:eventId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const db = getDb();
  const valid = db.prepare('SELECT 1 FROM team_memberships tm JOIN events e ON e.team_id = tm.team_id WHERE tm.team_id = ? AND tm.person_id = ? AND e.id = ?').get(team.id, req.params.personId, req.params.eventId);
  if (!valid) return res.status(404).json({ error: 'person or event not found in team' });
  if (req.body.status) {
    db.prepare(`INSERT INTO attendance (person_id, event_id, status, note) VALUES (?, ?, ?, ?)
      ON CONFLICT(person_id, event_id) DO UPDATE SET status = excluded.status, note = excluded.note`)
      .run(req.params.personId, req.params.eventId, req.body.status, req.body.note || '');
  } else {
    db.prepare('DELETE FROM attendance WHERE person_id = ? AND event_id = ?').run(req.params.personId, req.params.eventId);
  }
  res.json({ ok: true });
});

router.put('/bulk', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const personId = typeof req.body.personId === 'string' ? req.body.personId : '';
  const status = typeof req.body.status === 'string' ? req.body.status : '';
  const eventIds = Array.isArray(req.body.eventIds) ? [...new Set(req.body.eventIds.filter(id => typeof id === 'string'))] : [];
  if (!personId) return res.status(400).json({ error: 'personId is required' });
  if (!['yes', 'maybe', 'no'].includes(status)) return res.status(400).json({ error: 'invalid attendance status' });
  if (!eventIds.length) return res.status(400).json({ error: 'at least one event is required' });
  const db = getDb();
  const validPerson = db.prepare('SELECT 1 FROM team_memberships WHERE team_id = ? AND person_id = ?').get(team.id, personId);
  if (!validPerson) return res.status(404).json({ error: 'person is not a member of this team' });
  const placeholders = eventIds.map(() => '?').join(',');
  const validEvents = db.prepare(`SELECT id FROM events WHERE team_id = ? AND id IN (${placeholders})`).all(team.id, ...eventIds).map(row => row.id);
  if (validEvents.length !== eventIds.length) return res.status(400).json({ error: 'one or more events do not belong to this team' });
  const update = db.prepare(`INSERT INTO attendance (person_id, event_id, status, note) VALUES (?, ?, ?, '')
    ON CONFLICT(person_id, event_id) DO UPDATE SET status = excluded.status`);
  db.transaction(() => validEvents.forEach(eventId => update.run(personId, eventId, status)))();
  res.json({ updated: validEvents.length });
});

module.exports = router;
