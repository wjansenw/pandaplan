const db = require('../repositories/dbRepository');

function getState() {
  const state = db.read();
  return {
    persons: state.persons,
    categories: state.categories,
    events: state.events,
    staffAssignments: state.staffAssignments,
  };
}

module.exports = { getState };
