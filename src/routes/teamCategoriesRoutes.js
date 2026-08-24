const express = require('express');
const { getDb } = require('../db/connection');
const teamService = require('../services/teamService');
const { generateId } = require('../utils/id');
const router = express.Router();

function rows(teamId) {
  const db = getDb();
  const categories = db.prepare('SELECT id, name, color FROM categories WHERE team_id = ? ORDER BY rowid').all(teamId);
  const roles = db.prepare(`SELECT category_id, role FROM category_staff_roles WHERE category_id IN (SELECT id FROM categories WHERE team_id = ?)` ).all(teamId);
  const byCategory = {};
  roles.forEach((r) => (byCategory[r.category_id] || (byCategory[r.category_id] = [])).push(r.role));
  return categories.map((c) => ({ ...c, requiredStaffRoles: byCategory[c.id] || [] }));
}

router.get('/', (req, res) => res.json(rows(teamService.getBySlug(req.params.slug).id)));
router.post('/', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const id = generateId();
  const roles = req.body.requiredStaffRoles || [];
  const db = getDb();
  db.transaction(() => {
    db.prepare('INSERT INTO categories (id, team_id, name, color) VALUES (?, ?, ?, ?)').run(id, team.id, req.body.name, req.body.color || '#4F7942');
    const insert = db.prepare('INSERT INTO category_staff_roles (category_id, role) VALUES (?, ?)');
    roles.forEach((role) => insert.run(id, role));
  })();
  res.status(201).json(rows(team.id));
});
router.put('/:categoryId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  const db = getDb();
  db.transaction(() => {
    db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ? AND team_id = ?').run(req.body.name, req.body.color || '#4F7942', req.params.categoryId, team.id);
    if (req.body.requiredStaffRoles !== undefined) {
      db.prepare('DELETE FROM category_staff_roles WHERE category_id = ?').run(req.params.categoryId);
      const insert = db.prepare('INSERT INTO category_staff_roles (category_id, role) VALUES (?, ?)');
      req.body.requiredStaffRoles.forEach((role) => insert.run(req.params.categoryId, role));
    }
  })();
  res.json(rows(team.id));
});
router.delete('/:categoryId', (req, res) => {
  const team = teamService.getBySlug(req.params.slug);
  getDb().prepare('DELETE FROM categories WHERE id = ? AND team_id = ?').run(req.params.categoryId, team.id);
  res.json(rows(team.id));
});
module.exports = router;
