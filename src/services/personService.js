const personsRepository = require('../repositories/personsRepository');
const AppError = require('../errors');
const { generateId } = require('../utils/id');

function create({ name }) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) throw new AppError(400, 'name is required');
  const id = generateId();
  const persons = personsRepository.create({ id, name: trimmedName });
  return { persons, id, name: trimmedName };
}

function update(id, { name }) {
  if (!personsRepository.findById(id)) throw new AppError(404, 'person not found');
  return personsRepository.update(id, { name });
}

function remove(id) {
  if (!personsRepository.findById(id)) throw new AppError(404, 'person not found');
  return personsRepository.remove(id);
}

module.exports = { create, update, remove };
