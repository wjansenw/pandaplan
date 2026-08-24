const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('../config');
const { runMigrations } = require('./migrate');
const { importIfNeeded } = require('./importLegacyJson');

let db = null;

// Repositories call this at module-load time to get their handle. It's
// idempotent and self-initializing (opens the file, runs any pending
// migrations, imports legacy JSON if present) on first call — whichever
// repository happens to load first triggers setup, so there's no
// separate "bootstrap step" server.js has to remember to call in the
// right order.
function getDb() {
  if (db) return db;

  if (!fs.existsSync(config.DATA_DIR)) fs.mkdirSync(config.DATA_DIR, { recursive: true });

  db = new Database(config.SQLITE_FILE);
  db.pragma('journal_mode = WAL');
  // Off by default per-connection in SQLite — without this, every
  // ON DELETE CASCADE / composite foreign key in the schema is silently
  // ignored rather than enforced.
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  importIfNeeded(db);

  return db;
}

module.exports = { getDb };
