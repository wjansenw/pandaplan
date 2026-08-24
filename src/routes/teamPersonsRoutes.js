const express = require('express');
const AppError = require('../errors');
const personsRepository = require('../repositories/personsRepository');
const teamsRepository = require('../repositories/teamsRepository');
const teamService = require('../services/teamService');
const config = require('../config');
const { generateId } = require('../utils/id');
const { sanitizeRoles } = require('../utils/roles');
const router = express.Router();

router.get('/', (req, res) => res.json(teamsRepository.findMembers(teamService.getBySlug(req.params.slug).id)));
router.post('/', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const name = (req.body.name || '').trim();
  if (!name) throw new AppError(400, 'name is required');
  const roles = req.body.roles === undefined ? [config.PARTICIPANT_ROLE] : sanitizeRoles(req.body.roles, config.ALL_ROLE_IDS);
  if (!roles || !roles.length) throw new AppError(400, 'at least one role is required');
  const id = generateId();
  personsRepository.create({ id, name, roles: [] });
  teamsRepository.addMember(team.id, id, roles);
  res.status(201).json(teamsRepository.findMembers(team.id));
});
router.put('/:personId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  if (!teamsRepository.isMember(team.id, req.params.personId)) throw new AppError(404, 'team membership not found');
  if (typeof req.body.name === 'string' && req.body.name.trim()) {
    require('../db/connection').getDb().prepare('UPDATE persons SET name = ? WHERE id = ?').run(req.body.name.trim(), req.params.personId);
  }
  res.json(teamsRepository.findMembers(team.id));
});
router.put('/:personId/roles', (req, res) => res.json(teamService.setRoles(req.params.slug, req.params.personId, req.body.roles)));
router.delete('/:personId', (req, res) => res.json(teamService.removeMember(req.params.slug, req.params.personId)));
module.exports = router;
