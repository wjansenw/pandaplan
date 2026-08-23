const db = require('../repositories/dbRepository');
const AppError = require('../errors');
const config = require('../config');
const { sanitizeRoles } = require('../utils/roles');
const { generateId } = require('../utils/id');

async function create({ name, requiredStaffRoles }) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) throw new AppError(400, 'name is required');
  const sanitizedRoles = sanitizeRoles(requiredStaffRoles, config.STAFF_ROLE_IDS) || [];

  const categories = await db.write((state) => {
    const color = config.CATEGORY_COLORS[state.categories.length % config.CATEGORY_COLORS.length];
    state.categories.push({ id: generateId(), name: trimmedName, color, requiredStaffRoles: sanitizedRoles });
    return state.categories;
  });
  return categories;
}

async function update(id, { requiredStaffRoles }) {
  const categories = await db.write((state) => {
    const cat = state.categories.find((c) => c.id === id);
    if (cat && requiredStaffRoles !== undefined) {
      cat.requiredStaffRoles = sanitizeRoles(requiredStaffRoles, config.STAFF_ROLE_IDS) || [];
    }
    return state.categories;
  });
  return categories;
}

async function remove(id) {
  const result = await db.write((state) => {
    state.categories = state.categories.filter((c) => c.id !== id);
    state.events.forEach((e) => {
      if (e.categoryId === id) e.categoryId = null;
    });
    return { categories: state.categories, events: state.events };
  });
  return result;
}

module.exports = { create, update, remove };
