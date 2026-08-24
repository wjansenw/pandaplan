const express = require('express');
const { getDb } = require('../db/connection');
const teamService = require('../services/teamService');
const { generateId } = require('../utils/id');
const router = express.Router({ mergeParams: true });

function rows(teamId) {
  return getDb().prepare(`
    SELECT e.id, e.category_id AS categoryId, e.date, e.start_time AS startTime,
           e.end_time AS endTime, e.location, e.description
    FROM events e WHERE e.team_id = ? ORDER BY e.date, e.start_time
  `).all(teamId);
}

router.get('/', (req, res) => res.json(rows(teamService.getBySlug(req.params.slug).id)));
router.post('/', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const id = generateId();
  getDb().prepare(`INSERT INTO events (id, team_id, category_id, date, start_time, end_time, location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, team.id, req.body.categoryId || null, req.body.date, req.body.startTime || '', req.body.endTime || '', req.body.location || '', req.body.description || '');
  res.status(201).json(rows(team.id));
});
router.put('/:eventId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  getDb().prepare(`UPDATE events SET category_id = ?, date = ?, start_time = ?, end_time = ?, location = ?, description = ?
    WHERE id = ? AND team_id = ?`).run(req.body.categoryId || null, req.body.date, req.body.startTime || '', req.body.endTime || '', req.body.location || '', req.body.description || '', req.params.eventId, team.id);
  res.json(rows(team.id));
});
router.delete('/:eventId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  getDb().prepare('DELETE FROM events WHERE id = ? AND team_id = ?').run(req.params.eventId, team.id);
  res.json(rows(team.id));
});
module.exports = router;
