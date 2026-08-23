const path = require('path');

// project root is one level up from src/
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.jsonl');
const PORT = process.env.PORT || 3000;

const CATEGORY_COLORS = ['#4F7942', '#B5503F', '#B8933F', '#4A6FA5', '#7B5EA7', '#A34F72', '#3A6B6E', '#8C6239'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Fixed role vocabulary. "participant" is the ordinary attendee role;
// Coach, Assistant-Coach, Trainer, Scorekeeper, Referee are staff roles.
// A person can hold any combination.
const PARTICIPANT_ROLE = 'participant';
const STAFF_ROLE_IDS = ['coach', 'assistant-coach', 'trainer', 'scorekeeper', 'referee'];
const ALL_ROLE_IDS = [PARTICIPANT_ROLE, ...STAFF_ROLE_IDS];

// Attendance status: yes, no, maybe, unknown (represented by no entry at all)
const ATTENDANCE_STATUS = ['yes', 'no', 'maybe'];
const NOTE_MAX_LEN = 200;

module.exports = {
  DATA_DIR,
  DB_FILE,
  LOGS_FILE,
  PORT,
  CATEGORY_COLORS,
  DATE_RE,
  TIME_RE,
  PARTICIPANT_ROLE,
  STAFF_ROLE_IDS,
  ALL_ROLE_IDS,
  ATTENDANCE_STATUS,
  NOTE_MAX_LEN,
};
