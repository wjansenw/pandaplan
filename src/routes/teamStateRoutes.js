const express = require('express');
const teamService = require('../services/teamService');
const teamsRepository = require('../repositories/teamsRepository');
const categoriesRepository = require('../repositories/categoriesRepository');
const eventsRepository = require('../repositories/eventsRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const staffAssignmentsRepository = require('../repositories/staffAssignmentsRepository');
const { getDb } = require('../db/connection');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const members = teamsRepository.findMembers(team.id);
  const categories = categoriesRepository.findAll().filter((c) => c.teamId === team.id);
  const events = eventsRepository.findAll().filter((e) => e.teamId === team.id);
  const memberIds = new Set(members.map((p) => p.id));
  const attendance = {};
  for (const personId of memberIds) attendance[personId] = {};
  const attendanceRows = getDb().prepare(`
    SELECT a.person_id, a.event_id, a.status, a.note
    FROM attendance a JOIN events e ON e.id = a.event_id
    WHERE e.team_id = ?
  `).all(team.id);
  attendanceRows.forEach((r) => {
    if (!attendance[r.person_id]) attendance[r.person_id] = {};
    attendance[r.person_id][r.event_id] = { status: r.status, note: r.note };
  });
  const staffAssignments = {};
  const staff = getDb().prepare(`
    SELECT sa.event_id, sa.person_id, sa.role
    FROM staff_assignments sa JOIN events e ON e.id = sa.event_id
    WHERE e.team_id = ?
  `).all(team.id);
  staff.forEach((r) => {
    const event = staffAssignments[r.event_id] || (staffAssignments[r.event_id] = {});
    (event[r.role] || (event[r.role] = [])).push(r.person_id);
  });
  res.json({ team, persons: members, categories, events, attendance, staffAssignments });
});

module.exports = router;
