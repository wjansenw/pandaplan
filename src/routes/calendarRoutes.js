const express = require('express');
const asyncHandler = require('../asyncHandler');
const calendarService = require('../services/calendarService');

const router = express.Router();

// No auth middleware here on purpose: these URLs are meant to be pasted
// into external calendar apps (Google/Apple Calendar etc.) that can't
// send our session cookie. The :token itself — an unguessable value from
// teams.calendar_token / persons.calendar_token, not the public slug or
// the guessable person id — is the credential. There is intentionally no
// "all teams" feed: there's no single unguessable token that should own
// visibility into every team at once.

router.get('/team/:token.ics', asyncHandler(async (req, res) => {
  const result = calendarService.buildTeamCalendarIcs(req.params.token);
  if (!result) return res.status(404).send('Unknown calendar');
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', 'inline; filename="pandaplan-team.ics"');
  res.send(result.ics);
}));

router.get('/person/:token.ics', asyncHandler(async (req, res) => {
  const result = calendarService.buildPersonCalendarIcs(req.params.token);
  if (!result) return res.status(404).send('Unknown calendar');
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', 'inline; filename="pandaplan-person.ics"');
  res.send(result.ics);
}));

module.exports = router;
