// Calendar feeds must be reachable without a login session (external
// calendar apps can't send our session cookie), so the feed URL itself
// has to carry an unguessable credential instead of relying on `slug`
// (public, human-chosen) or `id` (Date.now()+Math.random(), guessable).
// randomblob(20) pulls 20 bytes from SQLite's CSPRNG; hex() gives us a
// 40-char token with no collisions in practice.
module.exports = {
  name: '007_add_calendar_tokens',
  up(db) {
    db.exec(`
      ALTER TABLE teams ADD COLUMN calendar_token TEXT NOT NULL DEFAULT '';
      ALTER TABLE persons ADD COLUMN calendar_token TEXT NOT NULL DEFAULT '';

      UPDATE teams SET calendar_token = lower(hex(randomblob(20))) WHERE calendar_token = '';
      UPDATE persons SET calendar_token = lower(hex(randomblob(20))) WHERE calendar_token = '';

      CREATE UNIQUE INDEX idx_teams_calendar_token ON teams(calendar_token);
      CREATE UNIQUE INDEX idx_persons_calendar_token ON persons(calendar_token);
    `);
  },
};
