const db = require('../repositories/dbRepository');
const AppError = require('../errors');
const config = require('../config');

function getForEvent(eventId) {
  const state = db.read();
  return state.staffAssignments[eventId] || {};
}

async function assign(eventId, { role, personId, assign: shouldAssign }) {
  if (!config.STAFF_ROLE_IDS.includes(role)) {
    throw new AppError(400, 'invalid role');
  }
  if (!personId) {
    throw new AppError(400, 'personId is required');
  }

  // Validation that depends on current data (does this person hold this
  // role right now?) happens *inside* the write transaction so it can't
  // race with a concurrent change, but it must not throw there — an
  // exception thrown inside a writeDb mutateFn used to leave the shared
  // write queue permanently rejected and crash the whole process. So we
  // signal failure via this flag and only throw once we're safely back
  // outside the transaction.
  let invalid = false;
  const staffAssignments = await db.write((state) => {
    if (!state.staffAssignments[eventId]) state.staffAssignments[eventId] = {};
    const perEvent = state.staffAssignments[eventId];

    if (shouldAssign) {
      const person = state.persons.find((p) => p.id === personId);
      if (!person || !person.roles.includes(role)) {
        invalid = true;
        return state.staffAssignments[eventId] || {};
      }
      // One role per person per event: drop this person from every
      // other role on this event before adding them to the new one.
      Object.keys(perEvent).forEach((r) => {
        perEvent[r] = (perEvent[r] || []).filter((id) => id !== personId);
        if (!perEvent[r].length) delete perEvent[r];
      });
      if (!perEvent[role]) perEvent[role] = [];
      if (!perEvent[role].includes(personId)) perEvent[role].push(personId);
    } else {
      if (perEvent[role]) {
        perEvent[role] = perEvent[role].filter((id) => id !== personId);
        if (!perEvent[role].length) delete perEvent[role];
      }
    }
    return state.staffAssignments[eventId] || {};
  });

  if (invalid) {
    throw new AppError(400, 'Person does not have this role');
  }
  return staffAssignments;
}

module.exports = { getForEvent, assign };
