const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

// Run against a completely isolated Pandaplan database. This is deliberately
// set before loading the application modules because src/config.js reads
// DATA_DIR at module initialization time.
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pandaplan-calendar-test-'));
process.env.DATA_DIR = testDataDir;
process.env.EVENT_TIMEZONE = 'Europe/Brussels';

const teamService = require('../../src/services/teamService');
const teamEventsRouter = require('../../src/routes/teamEventsRoutes');
const calendarRouter = require('../../src/routes/calendarRoutes');

function routeHandler(router, method, routePath) {
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === routePath && entry.route.methods[method]
  );
  assert.ok(layer, `route ${method.toUpperCase()} ${routePath} not found`);
  return layer.route.stack[0].handle;
}

function createEvent(slug, body) {
  const handler = routeHandler(teamEventsRouter, 'post', '/');
  let statusCode = 200;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(bodyValue) {
      responseBody = bodyValue;
      return this;
    },
  };

  handler({ params: { slug }, body }, res);

  assert.strictEqual(statusCode, 201);
  assert.ok(Array.isArray(responseBody));
  assert.strictEqual(responseBody.length >= 1, true);
  return responseBody[responseBody.length - 1];
}

async function exportTeamCalendar(token) {
  const handler = routeHandler(calendarRouter, 'get', '/team/:token.ics');
  let responseBody;
  let statusCode = 200;

  const res = {
    set() {
      return this;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    send(body) {
      responseBody = body;
      return this;
    },
  };

  let nextError;
  await handler({ params: { token } }, res, (error) => {
    nextError = error;
  });

  if (nextError) throw nextError;
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(typeof responseBody, 'string');
  return responseBody;
}

test('Pandaplan event creation and ICS export preserve CET and CEST local times', async () => {
  const team = teamService.create({
    name: 'Calendar integration test',
    slug: 'calendar-integration-test',
    description: '',
  });

  // Create the events through the same POST route used by the Pandaplan API,
  // rather than constructing event objects for the ICS builder directly.
  const cetEvent = createEvent(team.slug, {
    subject: 'CET training',
    date: '2026-01-15',
    startTime: '19:00',
    endTime: '21:00',
    location: 'CET test location',
    description: 'Created by the Pandaplan event endpoint',
  });

  const cestEvent = createEvent(team.slug, {
    subject: 'CEST training',
    date: '2026-07-15',
    startTime: '19:00',
    endTime: '21:00',
    location: 'CEST test location',
    description: 'Created by the Pandaplan event endpoint',
  });

  assert.strictEqual(cetEvent.date, '2026-01-15');
  assert.strictEqual(cetEvent.startTime, '19:00');
  assert.strictEqual(cetEvent.endTime, '21:00');
  assert.strictEqual(cestEvent.date, '2026-07-15');
  assert.strictEqual(cestEvent.startTime, '19:00');
  assert.strictEqual(cestEvent.endTime, '21:00');

  // Export the team's actual calendar feed through the public calendar route.
  const ics = await exportTeamCalendar(team.calendarToken);

  // Belgium is UTC+1 in January: 19:00 CET = 18:00 UTC.
  assert.match(ics, /SUMMARY:CET training/);
  assert.match(ics, /DTSTART:20260115T180000Z/);
  assert.match(ics, /DTEND:20260115T200000Z/);

  // Belgium is UTC+2 in July: 19:00 CEST = 17:00 UTC.
  assert.match(ics, /SUMMARY:CEST training/);
  assert.match(ics, /DTSTART:20260715T170000Z/);
  assert.match(ics, /DTEND:20260715T190000Z/);
});
