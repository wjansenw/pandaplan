const categoriesRepository = require('../repositories/categoriesRepository');
const eventsRepository = require('../repositories/eventsRepository');
const AppError = require('../errors');
const config = require('../config');
const { sanitizeRoles } = require('../utils/roles');
const { generateId } = require('../utils/id');

function create({ name, requiredStaffRoles }) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) throw new AppError(400, 'name is required');
  const sanitizedRoles = sanitizeRoles(requiredStaffRoles, config.STAFF_ROLE_IDS) || [];

  const color = config.CATEGORY_COLORS[categoriesRepository.count() % config.CATEGORY_COLORS.length];
  return categoriesRepository.create({ id: generateId(), name: trimmedName, color, requiredStaffRoles: sanitizedRoles });
}

function update(id, { requiredStaffRoles }) {
  return categoriesRepository.update(id, {
    requiredStaffRoles: requiredStaffRoles !== undefined
      ? (sanitizeRoles(requiredStaffRoles, config.STAFF_ROLE_IDS) || [])
      : undefined,
  });
}

function remove(id) {
  const categories = categoriesRepository.remove(id);
  // events referencing this category are set to null via ON DELETE SET
  // NULL in the schema — return both so routes can keep their existing
  // response shape ({ categories, events }).
  const events = eventsRepository.findAll();
  return { categories, events };
}

module.exports = { create, update, remove };
