const eventsRepository = require('../repositories/eventsRepository');
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

function create(body) {
  const err = validate(body);
  if (err) throw new AppError(400, err);
  const { categoryId, date, startTime, endTime, location, description } = body;
  return eventsRepository.create({
    id: generateId(),
    categoryId: categoryId || null,
    date,
    startTime: startTime || '',
    endTime: endTime || '',
    location: (location || '').trim(),
    description: (description || '').trim(),
  });
}

function update(id, body) {
  const err = validate(body);
  if (err) throw new AppError(400, err);
  const { categoryId, date, startTime, endTime, location, description } = body;
  return eventsRepository.update(id, {
    categoryId: categoryId || null,
    date,
    startTime: startTime || '',
    endTime: endTime || '',
    location: (location || '').trim(),
    description: (description || '').trim(),
  });
}

function remove(id) {
  // attendance and staff_assignments rows for this event are cleaned up
  // automatically via ON DELETE CASCADE in the schema.
  return eventsRepository.remove(id);
}

module.exports = { validate, create, update, remove };
