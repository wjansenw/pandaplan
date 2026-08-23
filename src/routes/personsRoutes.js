const express = require('express');
const asyncHandler = require('../asyncHandler');
const personService = require('../services/personService');
const auditService = require('../services/auditService');

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const { persons, name, roles } = await personService.create(req.body);
  auditService.log(req, 'create_person', { name, roles });
  res.json({ persons });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const persons = await personService.update(req.params.id, req.body);
  auditService.log(req, 'update_person', { personId: req.params.id, changes: req.body });
  res.json({ persons });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const persons = await personService.remove(req.params.id);
  auditService.log(req, 'delete_person', { personId: req.params.id });
  res.json({ persons });
}));

module.exports = router;
