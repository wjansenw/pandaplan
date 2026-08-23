const db = require('../repositories/dbRepository');
const AppError = require('../errors');
const config = require('../config');
const { sanitizeRoles } = require('../utils/roles');
const { generateId } = require('../utils/id');

async function create({ name, roles }) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) throw new AppError(400, 'name is required');

  // If roles isn't provided at all, default to plain participant. If it
  // IS provided, respect it as given (even staff-only).
  const finalRoles = roles === undefined
    ? [config.PARTICIPANT_ROLE]
    : (sanitizeRoles(roles, config.ALL_ROLE_IDS) || []);
  if (!finalRoles.length) throw new AppError(400, 'at least one role is required');

  const persons = await db.write((state) => {
    state.persons.push({ id: generateId(), name: trimmedName, roles: finalRoles });
    return state.persons;
  });
  return { persons, name: trimmedName, roles: finalRoles };
}

async function update(id, { name, roles }) {
  if (roles !== undefined) {
    const sanitized = sanitizeRoles(roles, config.ALL_ROLE_IDS);
    if (!sanitized || !sanitized.length) throw new AppError(400, 'at least one role is required');
  }
  const persons = await db.write((state) => {
    const person = state.persons.find((p) => p.id === id);
    if (person) {
      if (typeof name === 'string' && name.trim()) person.name = name.trim();
      if (roles !== undefined) person.roles = sanitizeRoles(roles, config.ALL_ROLE_IDS);
    }
    return state.persons;
  });
  return persons;
}

async function remove(id) {
  const persons = await db.write((state) => {
    state.persons = state.persons.filter((p) => p.id !== id);
    delete state.attendance[id];
    // Drop this person from any staff role they held on any event.
    Object.keys(state.staffAssignments).forEach((eventId) => {
      const assignments = state.staffAssignments[eventId];
      Object.keys(assignments).forEach((role) => {
        assignments[role] = (assignments[role] || []).filter((personId) => personId !== id);
        if (!assignments[role].length) delete assignments[role];
      });
    });
    return state.persons;
  });
  return persons;
}

module.exports = { create, update, remove };
