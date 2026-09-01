const fs = require('fs');
const os = require('os');
const http = require('http');
const crypto = require('crypto');

// Set test configuration before loading application modules. config.js reads
// DATA_DIR at module load time.
const dataDir = fs.mkdtempSync(require('path').join(os.tmpdir(), 'pandaplan-test-'));
process.env.DATA_DIR = dataDir;
process.env.SESSION_SECRET = 'pandaplan-test-session-secret';
process.env.NODE_ENV = 'test';

const { createApp } = require('../server');
const { getDb, closeDb } = require('../src/db/connection');

let currentAccount = null;
const app = createApp({ testAccountProvider: () => currentAccount });
const server = http.createServer(app);
let listening = false;

function setAccount(account) {
  currentAccount = account;
}

function request(method, requestPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      server: 'localhost',
      port: server.address().port,
      path: requestPath,
      method,
      headers: {
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        if (data) {
          try { parsed = JSON.parse(data); } catch { parsed = data; }
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function start() {
  if (listening) return;
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', error => error ? reject(error) : resolve());
  });
  listening = true;
}

async function stop() {
  if (listening) {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    listening = false;
  }
  closeDb();
  fs.rmSync(dataDir, { recursive: true, force: true });
}

function resetDatabase() {
  const db = getDb();
  db.exec(`
    DELETE FROM attendance;
    DELETE FROM staff_assignments;
    DELETE FROM team_membership_roles;
    DELETE FROM team_memberships;
    DELETE FROM categories;
    DELETE FROM events;
    DELETE FROM persons;
    DELETE FROM teams;
  `);
}

function seedTeam({ id = 'team-1', name = 'Test Team', slug = 'test-team' } = {}) {
  const db = getDb();
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO teams (id, name, slug, description, calendar_token) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, slug, '', token);
  return db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
}

function seedPerson({ id = 'person-1', name = 'Alice Example' } = {}) {
  const db = getDb();
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO persons (id, name, calendar_token) VALUES (?, ?, ?)').run(id, name, token);
  return db.prepare('SELECT * FROM persons WHERE id = ?').get(id);
}

function addMember(teamId, personId, roles = ['participant']) {
  const db = getDb();
  db.prepare('INSERT INTO team_memberships (team_id, person_id) VALUES (?, ?)').run(teamId, personId);
  const insertRole = db.prepare('INSERT INTO team_membership_roles (team_id, person_id, role) VALUES (?, ?, ?)');
  roles.forEach(role => insertRole.run(teamId, personId, role));
}

function seedEvent({ id = 'event-1', teamId, subject = 'Training', date = '2026-09-01', startTime = '19:00', endTime = '20:30', location = 'Sports Hall', description = 'Regular training' } = {}) {
  const db = getDb();
  db.prepare(`INSERT INTO events (id, team_id, category_id, subject, date, start_time, end_time, location, description)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`).run(id, teamId, subject, date, startTime, endTime, location, description);
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id);
}

module.exports = {
  getDb,
  request,
  start,
  stop,
  setAccount,
  resetDatabase,
  seedTeam,
  seedPerson,
  addMember,
  seedEvent,
};
