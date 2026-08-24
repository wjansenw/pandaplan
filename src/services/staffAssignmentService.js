const staffAssignmentsRepository = require('../repositories/staffAssignmentsRepository');
const personsRepository = require('../repositories/personsRepository');
const AppError = require('../errors');
const config = require('../config');

function getForEvent(eventId) {
  return staffAssignmentsRepository.findForEvent(eventId);
}

// Note how much simpler this is than the JSON-file version: there's no
// more "remove this person from every other role first" bookkeeping and
// no more validate-without-throwing-inside-a-transaction dance. The
// schema's PRIMARY KEY (event_id, person_id) means the upsert in
// staffAssignmentsRepository.assign() can only ever change a person's
// role for this event, never add a second one — "one role per person
// per event" is now guaranteed by construction, not by careful JS.
function assign(eventId, { role, personId, assign: shouldAssign }) {
  if (!config.STAFF_ROLE_IDS.includes(role)) {
    throw new AppError(400, 'invalid role');
  }
  if (!personId) {
    throw new AppError(400, 'personId is required');
  }

  if (shouldAssign) {
    const person = personsRepository.findById(personId);
    if (!person || !person.roles.includes(role)) {
      throw new AppError(400, 'Person does not have this role');
    }
    return staffAssignmentsRepository.assign(eventId, personId, role);
  }
  return staffAssignmentsRepository.unassign(eventId, personId, role);
}

module.exports = { getForEvent, assign };
