const fs = require('fs');
const config = require('../config');

// Runs once, only if there's a legacy db.json AND the SQLite store is
// still empty (so it never overwrites real SQLite data — e.g. on a
// second startup after the file's already been renamed away below).
function importIfNeeded(db) {
  if (!fs.existsSync(config.LEGACY_JSON_FILE)) return;

  const personCount = db.prepare('SELECT COUNT(*) AS n FROM persons').get().n;
  if (personCount > 0) return;

  console.log('[import] found legacy db.json, importing into SQLite...');
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(config.LEGACY_JSON_FILE, 'utf8'));
  } catch (e) {
    console.error('[import] could not parse legacy db.json, skipping import:', e.message);
    return;
  }

  const insertPerson = db.prepare('INSERT INTO persons (id, name) VALUES (?, ?)');
  const insertPersonRole = db.prepare('INSERT OR IGNORE INTO person_roles (person_id, role) VALUES (?, ?)');
  const insertCategory = db.prepare('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)');
  const insertCategoryRole = db.prepare('INSERT OR IGNORE INTO category_staff_roles (category_id, role) VALUES (?, ?)');
  const insertEvent = db.prepare(`
    INSERT INTO events (id, category_id, date, start_time, end_time, location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAttendance = db.prepare(`
    INSERT OR IGNORE INTO attendance (person_id, event_id, status, note) VALUES (?, ?, ?, ?)
  `);
  const insertStaffAssignment = db.prepare(`
    INSERT OR IGNORE INTO staff_assignments (event_id, person_id, role) VALUES (?, ?, ?)
  `);

  const runImport = db.transaction(() => {
    (raw.persons || []).forEach((p) => {
      insertPerson.run(p.id, p.name);
      (p.roles && p.roles.length ? p.roles : ['participant']).forEach((r) => {
        insertPersonRole.run(p.id, r);
      });
    });

    (raw.categories || []).forEach((c) => {
      insertCategory.run(c.id, c.name, c.color || '#4F7942');
      (c.requiredStaffRoles || []).forEach((r) => insertCategoryRole.run(c.id, r));
    });

    (raw.events || []).forEach((e) => {
      insertEvent.run(
        e.id, e.categoryId || null, e.date,
        e.startTime || '', e.endTime || '', e.location || '', e.description || ''
      );
    });

    Object.entries(raw.attendance || {}).forEach(([personId, byEvent]) => {
      Object.entries(byEvent || {}).forEach(([eventId, entry]) => {
        if (!entry || !entry.status) return;
        insertAttendance.run(personId, eventId, entry.status, entry.note || '');
      });
    });

    // staffAssignments[eventId][role] could be a single personId (very
    // old shape) or an array (current shape) — handle both. Assignments
    // referencing a person/role that no longer holds that role, or a
    // person that no longer exists, are silently skipped: the schema's
    // foreign key would reject them anyway, and a stale assignment isn't
    // worth failing the whole import over.
    Object.entries(raw.staffAssignments || {}).forEach(([eventId, byRole]) => {
      Object.entries(byRole || {}).forEach(([role, personIdOrIds]) => {
        const personIds = Array.isArray(personIdOrIds) ? personIdOrIds : (personIdOrIds ? [personIdOrIds] : []);
        personIds.forEach((personId) => {
          try {
            insertStaffAssignment.run(eventId, personId, role);
          } catch (e) {
            console.warn(`[import] skipped stale staff assignment (event ${eventId}, person ${personId}, role ${role}): ${e.message}`);
          }
        });
      });
    });
  });

  runImport();

  const backupPath = config.LEGACY_JSON_FILE + '.imported';
  fs.renameSync(config.LEGACY_JSON_FILE, backupPath);
  console.log(`[import] done — old file moved to ${backupPath}`);
}

module.exports = { importIfNeeded };
