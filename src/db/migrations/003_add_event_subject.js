module.exports = {
  name: '003_add_event_subject',
  up(db) {
    db.exec(`
      ALTER TABLE events ADD COLUMN subject TEXT NOT NULL DEFAULT '';
    `);
  },
};
