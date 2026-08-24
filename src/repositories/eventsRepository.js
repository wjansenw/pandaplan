const { getDb } = require('../db/connection');

const SELECT_COLUMNS = `
  id,
  team_id AS teamId,
  category_id AS categoryId,
  date,
  start_time AS startTime,
  end_time AS endTime,
  location,
  description
`;

function findAll() {
  return getDb().prepare(`SELECT ${SELECT_COLUMNS} FROM events ORDER BY date, start_time`).all();
}

function findById(id) {
  return getDb().prepare(`SELECT ${SELECT_COLUMNS} FROM events WHERE id = ?`).get(id) || null;
}

module.exports = { findAll, findById };
