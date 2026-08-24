const express = require('express');
const asyncHandler = require('../asyncHandler');
const calendarService = require('../services/calendarService');

const router = express.Router();

router.get('/all.ics', asyncHandler(async (req, res) => {
  const ics = calendarService.buildFullCalendarIcs();
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', 'inline; filename="pandaplan.ics"');
  res.send(ics);
}));

router.get('/team/:slug.ics', asyncHandler(async (req, res) => {
  const result = calendarService.buildTeamCalendarIcs(req.params.slug);
  if (!result) return res.status(404).send('Unknown team');
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', `inline; filename="pandaplan-${result.slug}.ics"`);
  res.send(result.ics);
}));

router.get('/person/:personId.ics', asyncHandler(async (req, res) => {
  const result = calendarService.buildPersonCalendarIcs(req.params.personId);
  if (!result) return res.status(404).send('Unknown person');
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', `inline; filename="pandaplan-${result.personName}.ics"`);
  res.send(result.ics);
}));

module.exports = router;
