const express = require('express');
const teamService = require('../services/teamService');
const teamsRepository = require('../repositories/teamsRepository');
const router = express.Router();

router.get('/', (req, res) => res.json(teamsRepository.findAll()));
router.post('/', (req, res) => res.status(201).json(teamService.create(req.body)));
router.get('/:slug', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  res.json({ ...team, members: teamsRepository.findMembers(team.id) });
});
router.put('/:slug', (req, res) => res.json(teamService.update(req.params.slug, req.body)));
router.delete('/:slug', (req, res) => { teamService.remove(req.params.slug); res.status(204).end(); });
router.post('/:slug/members/:personId', (req, res) => res.json(teamService.addExistingMember(req.params.slug, req.params.personId)));
router.delete('/:slug/members/:personId', (req, res) => res.json(teamService.removeMember(req.params.slug, req.params.personId)));
router.put('/:slug/members/:personId/roles', (req, res) => res.json(teamService.setRoles(req.params.slug, req.params.personId, req.body.roles)));

module.exports = router;
