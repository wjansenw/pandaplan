const express = require('express');
const asyncHandler = require('../asyncHandler');
const staffAssignmentService = require('../services/staffAssignmentService');
const auditService = require('../services/auditService');

const router = express.Router();

router.get('/:eventId', asyncHandler(async (req, res) => {
  res.json({ staffAssignments: staffAssignmentService.getForEvent(req.params.eventId) });
}));

router.put('/:eventId', asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const staffAssignments = await staffAssignmentService.assign(eventId, req.body);
  auditService.log(req, 'assign_staff', {
    eventId,
    role: req.body.role,
    personId: req.body.personId,
    assign: !!req.body.assign,
  });
  res.json({ staffAssignments });
}));

module.exports = router;
