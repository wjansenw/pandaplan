const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const alreadyApplied = new Set(
    db.prepare('SELECT name FROM schema_migrations').all().map((r) => r.name)
  );

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort(); // filenames are zero-padded numeric prefixes, so sort = apply order

  const recordApplied = db.prepare(
    'INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)'
  );

  for (const file of files) {
    const migration = require(path.join(MIGRATIONS_DIR, file));
    if (alreadyApplied.has(migration.name)) continue;

    const applyOne = db.transaction(() => {
      migration.up(db);
      recordApplied.run(migration.name, new Date().toISOString());
    });
    applyOne();
    console.log(`[migrate] applied ${migration.name}`);
  }
}

module.exports = { runMigrations };
