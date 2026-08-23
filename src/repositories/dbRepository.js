const fs = require('fs');
const config = require('../config');
const { sanitizeRoles } = require('../utils/roles');

function ensureDb() {
  if (!fs.existsSync(config.DATA_DIR)) fs.mkdirSync(config.DATA_DIR, { recursive: true });
  if (!fs.existsSync(config.DB_FILE)) {
    fs.writeFileSync(config.DB_FILE, JSON.stringify({
      persons: [], categories: [], events: [], attendance: {}, staffAssignments: {}
    }, null, 2));
  }
}

// Reads the full store and normalizes it into a consistent shape. This is
// "self-healing" backward compatibility, not business logic: older
// records may be missing fields (roles, requiredStaffRoles) or use an
// older staffAssignments shape (single personId instead of an array per
// role). Normalizing here means every service can assume clean, current
// data without needing a separate migration step.
function read() {
  ensureDb();
  const state = JSON.parse(fs.readFileSync(config.DB_FILE, 'utf8'));
  if (!Array.isArray(state.persons)) state.persons = [];
  if (!Array.isArray(state.categories)) state.categories = [];
  if (!Array.isArray(state.events)) state.events = [];
  if (typeof state.attendance !== 'object' || state.attendance === null) state.attendance = {};
  if (typeof state.staffAssignments !== 'object' || state.staffAssignments === null) state.staffAssignments = {};

  state.persons.forEach((p) => {
    const roles = sanitizeRoles(p.roles, config.ALL_ROLE_IDS);
    p.roles = roles && roles.length ? roles : [config.PARTICIPANT_ROLE];
  });

  state.categories.forEach((c) => {
    c.requiredStaffRoles = sanitizeRoles(c.requiredStaffRoles, config.STAFF_ROLE_IDS) || [];
  });

  // staffAssignments[eventId][role] used to hold a single personId (one
  // slot per role). It's now an array (multiple people can share a
  // role), with the invariant that a person appears under at most one
  // role per event.
  Object.keys(state.staffAssignments).forEach((eventId) => {
    const perEvent = state.staffAssignments[eventId];
    if (!perEvent || typeof perEvent !== 'object') {
      delete state.staffAssignments[eventId];
      return;
    }
    const seenPersonIds = new Set();
    Object.keys(perEvent).forEach((role) => {
      if (!config.STAFF_ROLE_IDS.includes(role)) {
        delete perEvent[role];
        return;
      }
      let ids = Array.isArray(perEvent[role]) ? perEvent[role] : (perEvent[role] ? [perEvent[role]] : []);
      ids = ids.filter((personId) => {
        if (seenPersonIds.has(personId)) return false; // one role per person per event
        const person = state.persons.find((p) => p.id === personId && p.roles.includes(role));
        if (!person) return false; // must currently hold that role
        seenPersonIds.add(personId);
        return true;
      });
      if (ids.length) perEvent[role] = ids;
      else delete perEvent[role];
    });
  });

  return state;
}

// Serializes writes so concurrent requests can't clobber each other.
let writeQueue = Promise.resolve();
function write(mutateFn) {
  const resultPromise = writeQueue.then(() => {
    const state = read();
    const result = mutateFn(state);
    fs.writeFileSync(config.DB_FILE, JSON.stringify(state, null, 2));
    return result;
  });
  // The shared queue itself must never reject: if mutateFn throws (e.g.
  // a validation error surfaced late), the caller of write() still sees
  // it via `resultPromise`, but `writeQueue` — which every future call
  // chains onto — is reassigned to a version that swallows the error.
  // Without this, one bad write leaves `writeQueue` permanently
  // rejected, breaking every subsequent write and crashing the whole
  // process via Node's unhandled-rejection handling (this previously
  // took the entire server down on a single invalid request).
  writeQueue = resultPromise.catch(() => {});
  return resultPromise;
}

module.exports = { ensureDb, read, write };
