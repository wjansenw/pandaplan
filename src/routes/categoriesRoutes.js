const express = require('express');
const asyncHandler = require('../asyncHandler');
const categoryService = require('../services/categoryService');
const auditService = require('../services/auditService');

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const categories = await categoryService.create(req.body);
  auditService.log(req, 'create_category', { name: req.body.name, requiredStaffRoles: req.body.requiredStaffRoles });
  res.json({ categories });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const categories = await categoryService.update(req.params.id, req.body);
  auditService.log(req, 'update_category', { categoryId: req.params.id, changes: req.body });
  res.json({ categories });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await categoryService.remove(req.params.id);
  auditService.log(req, 'delete_category', { categoryId: req.params.id });
  res.json(result);
}));

module.exports = router;
