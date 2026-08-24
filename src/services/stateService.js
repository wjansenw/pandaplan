const personsRepository = require('../repositories/personsRepository');
const categoriesRepository = require('../repositories/categoriesRepository');
const eventsRepository = require('../repositories/eventsRepository');
const staffAssignmentsRepository = require('../repositories/staffAssignmentsRepository');

function getState() {
  return {
    persons: personsRepository.findAll(),
    categories: categoriesRepository.findAll(),
    events: eventsRepository.findAll(),
    staffAssignments: staffAssignmentsRepository.findAllGroupedByEvent(),
  };
}

module.exports = { getState };
