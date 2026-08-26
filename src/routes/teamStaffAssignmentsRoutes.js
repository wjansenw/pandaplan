const express = require('express');
const { getDb } = require('../db/connection');
const teamService = require('../services/teamService');
const router = express.Router({ mergeParams: true });

router.get('/:eventId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const rows = getDb().prepare('SELECT person_id, role FROM staff_assignments WHERE event_id = ? AND team_id = ?').all(req.params.eventId, team.id);
  const result = {};
  rows.forEach((r) => (result[r.role] || (result[r.role] = [])).push(r.person_id));
  res.json(result);
});
router.put('/:eventId/:personId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const db = getDb();
  if (!db.prepare('SELECT 1 FROM events WHERE id = ? AND team_id = ?').get(req.params.eventId, team.id)) return res.status(404).json({ error: 'event not found in team' });
  if (!db.prepare('SELECT 1 FROM team_membership_roles WHERE team_id = ? AND person_id = ? AND role = ?').get(team.id, req.params.personId, req.body.role)) return res.status(400).json({ error: 'person does not have this role in the team' });

  const assign = db.transaction(() => {
    db.prepare('DELETE FROM staff_assignments WHERE event_id = ? AND team_id = ? AND person_id = ?').run(req.params.eventId, team.id, req.params.personId);
    db.prepare('INSERT INTO staff_assignments (event_id, team_id, person_id, role) VALUES (?, ?, ?, ?)').run(req.params.eventId, team.id, req.params.personId, req.body.role);
  });
  assign();

  res.json({ ok: true });
});
router.delete('/:eventId/:personId/:role', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  getDb().prepare('DELETE FROM staff_assignments WHERE event_id = ? AND team_id = ? AND person_id = ? AND role = ?').run(req.params.eventId, team.id, req.params.personId, req.params.role);
  res.json({ ok: true });
});
module.exports = router;
