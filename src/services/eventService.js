const db = require('../repositories/dbRepository');
const AppError = require('../errors');
const config = require('../config');
const { generateId } = require('../utils/id');

function validate(body) {
  const { date, startTime, endTime } = body;
  if (!date || !config.DATE_RE.test(date)) return 'date must be YYYY-MM-DD';
  if (startTime && !config.TIME_RE.test(startTime)) return 'startTime must be HH:MM';
  if (endTime && !config.TIME_RE.test(endTime)) return 'endTime must be HH:MM';
  if (startTime && endTime && endTime < startTime) return 'endTime must not be before startTime';
  return null;
}

async function create(body) {
  const err = validate(body);
  if (err) throw new AppError(400, err);
  const { categoryId, date, startTime, endTime, location, description } = body;

  const events = await db.write((state) => {
    state.events.push({
      id: generateId(),
      categoryId: categoryId || null,
      date,
      startTime: startTime || '',
      endTime: endTime || '',
      location: (location || '').trim(),
      description: (description || '').trim(),
    });
    return state.events;
  });
  return events;
}

async function update(id, body) {
  const err = validate(body);
  if (err) throw new AppError(400, err);
  const { categoryId, date, startTime, endTime, location, description } = body;

  const events = await db.write((state) => {
    const ev = state.events.find((e) => e.id === id);
    if (ev) {
      ev.categoryId = categoryId || null;
      ev.date = date;
      ev.startTime = startTime || '';
      ev.endTime = endTime || '';
      ev.location = (location || '').trim();
      ev.description = (description || '').trim();
    }
    return state.events;
  });
  return events;
}

async function remove(id) {
  const events = await db.write((state) => {
    state.events = state.events.filter((e) => e.id !== id);
    Object.keys(state.attendance).forEach((personId) => {
      delete state.attendance[personId][id];
    });
    delete state.staffAssignments[id];
    return state.events;
  });
  return events;
}

module.exports = { validate, create, update, remove };
