const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('../config');
const { runMigrations } = require('./migrate');

let db = null;

function getDb() {
  if (db) return db;

  if (!fs.existsSync(config.DATA_DIR)) fs.mkdirSync(config.DATA_DIR, { recursive: true });

  db = new Database(config.SQLITE_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return db;
}

function closeDb() {
  if (!db) return;
  db.close();
  db = null;
}

module.exports = { getDb, closeDb };
