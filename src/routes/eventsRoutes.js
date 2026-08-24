const express = require('express');
const asyncHandler = require('../asyncHandler');
const eventService = require('../services/eventService');
const auditService = require('../services/auditService');

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const events = await eventService.create(req.body);
  auditService.log(req, 'create_event', { date: req.body.date, location: req.body.location });
  res.json({ events });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const events = await eventService.update(req.params.id, req.body);
  auditService.log(req, 'update_event', { eventId: req.params.id });
  res.json({ events });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const events = await eventService.remove(req.params.id);
  auditService.log(req, 'delete_event', { eventId: req.params.id });
  res.json({ events });
}));

module.exports = router;
