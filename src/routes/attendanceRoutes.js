const express = require('express');
const asyncHandler = require('../asyncHandler');
const attendanceService = require('../services/attendanceService');
const auditService = require('../services/auditService');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json({ attendance: attendanceService.getAll() });
}));

router.get('/:personId', asyncHandler(async (req, res) => {
  res.json({ attendance: attendanceService.getForPerson(req.params.personId) });
}));

router.put('/:personId/:eventId', asyncHandler(async (req, res) => {
  const { personId, eventId } = req.params;
  const attendance = await attendanceService.setStatus(personId, eventId, req.body);
  auditService.log(req, 'update_attendance', { personId, eventId, status: req.body.status });
  res.json({ attendance });
}));

module.exports = router;
