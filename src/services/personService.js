const personsRepository = require('../repositories/personsRepository');
const AppError = require('../errors');
const config = require('../config');
const { sanitizeRoles } = require('../utils/roles');
const { generateId } = require('../utils/id');

function create({ name, roles }) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) throw new AppError(400, 'name is required');

  // If roles isn't provided at all, default to plain participant. If it
  // IS provided, respect it as given (even staff-only).
  const finalRoles = roles === undefined
    ? [config.PARTICIPANT_ROLE]
    : (sanitizeRoles(roles, config.ALL_ROLE_IDS) || []);
  if (!finalRoles.length) throw new AppError(400, 'at least one role is required');

  const persons = personsRepository.create({ id: generateId(), name: trimmedName, roles: finalRoles });
  return { persons, name: trimmedName, roles: finalRoles };
}

function update(id, { name, roles }) {
  if (roles !== undefined) {
    const sanitized = sanitizeRoles(roles, config.ALL_ROLE_IDS);
    if (!sanitized || !sanitized.length) throw new AppError(400, 'at least one role is required');
  }
  return personsRepository.update(id, { name, roles: roles !== undefined ? sanitizeRoles(roles, config.ALL_ROLE_IDS) : undefined });
}

function remove(id) {
  // person_roles, attendance, and staff_assignments rows for this person
  // are all cleaned up automatically via ON DELETE CASCADE in the schema.
  return personsRepository.remove(id);
}

module.exports = { create, update, remove };
