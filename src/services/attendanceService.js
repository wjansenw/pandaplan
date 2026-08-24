const attendanceRepository = require('../repositories/attendanceRepository');
const AppError = require('../errors');
const config = require('../config');

function getAll() {
  return attendanceRepository.findAll();
}

function getForPerson(personId) {
  return attendanceRepository.findForPerson(personId);
}

function setStatus(personId, eventId, { status, note }) {
  if (status && !config.ATTENDANCE_STATUS.includes(status)) {
    throw new AppError(400, 'invalid status');
  }
  const trimmedNote = typeof note === 'string' ? note.trim().slice(0, config.NOTE_MAX_LEN) : '';
  return attendanceRepository.setStatus(personId, eventId, status || null, trimmedNote);
}

module.exports = { getAll, getForPerson, setStatus };
