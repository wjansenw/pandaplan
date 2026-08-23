const db = require('../repositories/dbRepository');
const AppError = require('../errors');
const config = require('../config');

function getAll() {
  const state = db.read();
  return state.attendance;
}

function getForPerson(personId) {
  const state = db.read();
  return state.attendance[personId] || {};
}

async function setStatus(personId, eventId, { status, note }) {
  if (status && !config.ATTENDANCE_STATUS.includes(status)) {
    throw new AppError(400, 'invalid status');
  }
  const trimmedNote = typeof note === 'string' ? note.trim().slice(0, config.NOTE_MAX_LEN) : '';

  const attendance = await db.write((state) => {
    if (!state.attendance[personId]) state.attendance[personId] = {};
    if (status) {
      state.attendance[personId][eventId] = { status, note: trimmedNote };
    } else {
      // No status (or explicitly falsy) means "unknown" — clear any entry.
      delete state.attendance[personId][eventId];
    }
    return state.attendance[personId];
  });
  return attendance;
}

module.exports = { getAll, getForPerson, setStatus };
