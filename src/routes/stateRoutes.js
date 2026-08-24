const express = require('express');
const asyncHandler = require('../asyncHandler');
const stateService = require('../services/stateService');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(stateService.getState());
}));

module.exports = router;
