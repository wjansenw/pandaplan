const express = require('express');
const { getDb } = require('../db/connection');
const teamService = require('../services/teamService');
const personService = require('../services/personService');
const teamsRepository = require('../repositories/teamsRepository');
const { generateId } = require('../utils/id');
const config = require('../config');
const router = express.Router();

router.get('/', (req, res) => res.json(teamsRepository.findMembers(teamService.getBySlug(req.params.slug).id)));
router.post('/', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const created = personService.create({ name: req.body.name, roles: req.body.roles || [config.PARTICIPANT_ROLE] });
  const db = getDb();
  db.transaction(() => {
    db.prepare('INSERT INTO team_memberships (team_id, person_id) VALUES (?, ?)').run(team.id, created.persons.find((p) => p.name === created.name)?.id || created.id || generateId());
  })();
  res.status(201).json(teamsRepository.findMembers(team.id));
});
router.put('/:personId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  if (!teamsRepository.isMember(team.id, req.params.personId)) return res.status(404).json({ error: 'team membership not found' });
  const updated = personService.update(req.params.personId, { name: req.body.name });
  res.json(updated);
});
router.put('/:personId/roles', (req, res) => res.json(teamService.setRoles(req.params.slug, req.params.personId, req.body.roles)));
router.delete('/:personId', (req, res) => res.json(teamService.removeMember(req.params.slug, req.params.personId)));
module.exports = router;
