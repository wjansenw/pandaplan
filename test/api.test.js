const assert = require('node:assert/strict');
const { describe, test, before, beforeEach, after } = require('node:test');
const {
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
} = require('./helpers/api');

describe('API', { concurrency: false }, () => {
  let team;
  let person;
  let event;

  before(async () => {
    await start();
  });

  beforeEach(() => {
    resetDatabase();
    team = seedTeam();
    person = seedPerson();
    addMember(team.id, person.id);
    event = seedEvent({ teamId: team.id });
    setAccount({ isSiteAdmin: true });
  });

  after(async () => {
    await stop();
  });

  test('AUTH-01 rejects an unauthenticated API request', async () => {
    setAccount(null);

    const response = await request('GET', '/api/teams');

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { error: 'authentication required' });
  });

  test('TEAM-01 lists teams for an authenticated site administrator', async () => {
    const response = await request('GET', '/api/teams');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [{
      id: team.id,
      name: team.name,
      slug: team.slug,
      description: '',
      memberCount: 1,
    }]);
  });

  test('TEAM-02 gets a team including its members and roles', async () => {
    const response = await request('GET', `/api/teams/${team.slug}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.id, team.id);
    assert.equal(response.body.slug, team.slug);
    assert.equal(response.body.members.length, 1);
    assert.equal(response.body.members[0].id, person.id);
    assert.deepEqual(response.body.members[0].roles, ['participant']);
  });

  test('TEAM-03 creates a team and derives its slug when omitted', async () => {
    const response = await request('POST', '/api/teams', {
      name: 'U13 Girls Team',
      description: 'Junior squad',
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.name, 'U13 Girls Team');
    assert.equal(response.body.slug, 'u13-girls-team');
    assert.equal(response.body.description, 'Junior squad');
    assert.ok(response.body.calendarToken);

    const stored = getDb().prepare('SELECT name, slug, description FROM teams WHERE id = ?').get(response.body.id);
    assert.deepEqual(stored, {
      name: 'U13 Girls Team',
      slug: 'u13-girls-team',
      description: 'Junior squad',
    });
  });

  test('TEAM-04 rejects team creation by a non-site administrator', async () => {
    setAccount({ isSiteAdmin: false });

    const response = await request('POST', '/api/teams', { name: 'Forbidden Team' });

    assert.equal(response.status, 403);
    assert.deepEqual(response.body, { error: 'site administrator access required' });
  });

  test('TEAM-05 rejects a duplicate team slug', async () => {
    const response = await request('POST', '/api/teams', { name: 'Test Team' });

    assert.equal(response.status, 409);
    assert.match(response.body.error, /slug "test-team" is already in use/);
  });

  test('PERSON-01 lists team members', async () => {
    const response = await request('GET', `/api/teams/${team.slug}/persons`);

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].id, person.id);
    assert.equal(response.body[0].name, person.name);
    assert.deepEqual(response.body[0].roles, ['participant']);
  });

  test('PERSON-02 creates a team member with the default participant role', async () => {
    const response = await request('POST', `/api/teams/${team.slug}/persons`, {
      name: 'Bob Example',
    });

    assert.equal(response.status, 201);
    const created = response.body.find(member => member.name === 'Bob Example');
    assert.ok(created);
    assert.deepEqual(created.roles, ['participant']);
    assert.ok(getDb().prepare('SELECT 1 FROM team_memberships WHERE team_id = ? AND person_id = ?').get(team.id, created.id));
  });

  test('PERSON-03 rejects an empty person name', async () => {
    const response = await request('POST', `/api/teams/${team.slug}/persons`, { name: '   ' });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: 'name is required' });
  });

  test('PERSON-04 creates a person with explicit roles', async () => {
    const response = await request('POST', `/api/teams/${team.slug}/persons`, {
      name: 'Coach Example',
      roles: ['participant', 'coach'],
    });

    assert.equal(response.status, 201);
    const created = response.body.find(member => member.name === 'Coach Example');
    assert.ok(created);
    assert.deepEqual(created.roles.sort(), ['coach', 'participant']);
  });

  test('PERSON-05 rejects an empty role list', async () => {
    const response = await request('POST', `/api/teams/${team.slug}/persons`, {
      name: 'No Role',
      roles: [],
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: 'at least one role is required' });
  });

  test('EVENT-01 lists team events in date/time order', async () => {
    seedEvent({ id: 'event-2', teamId: team.id, subject: 'Match', date: '2026-09-02', startTime: '14:00', endTime: '16:00' });
    seedEvent({ id: 'event-3', teamId: team.id, subject: 'Early Training', date: '2026-09-01', startTime: '17:00', endTime: '18:00' });

    const response = await request('GET', `/api/teams/${team.slug}/events`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.map(e => e.id), ['event-3', 'event-1', 'event-2']);
  });

  test('EVENT-02 creates an event with its supplied fields', async () => {
    const response = await request('POST', `/api/teams/${team.slug}/events`, {
      subject: 'League Match',
      date: '2026-09-05',
      startTime: '10:00',
      endTime: '12:00',
      location: 'Main Stadium',
      description: 'Home match',
    });

    assert.equal(response.status, 201);
    const created = response.body.find(e => e.subject === 'League Match');
    assert.ok(created);
    assert.equal(created.date, '2026-09-05');
    assert.equal(created.startTime, '10:00');
    assert.equal(created.endTime, '12:00');
    assert.equal(created.location, 'Main Stadium');
    assert.equal(created.description, 'Home match');
  });

  test('EVENT-03 rejects a category belonging to another team', async () => {
    const otherTeam = seedTeam({ id: 'team-2', name: 'Other Team', slug: 'other-team' });
    const categoryId = 'category-2';
    getDb().prepare('INSERT INTO categories (id, team_id, name, color) VALUES (?, ?, ?, ?)')
      .run(categoryId, otherTeam.id, 'Other Category', '#123456');

    const response = await request('POST', `/api/teams/${team.slug}/events`, {
      categoryId,
      subject: 'Invalid Category Event',
      date: '2026-09-05',
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: 'category does not belong to this team' });
  });

  test('EVENT-04 updates an event', async () => {
    const response = await request('PUT', `/api/teams/${team.slug}/events/${event.id}`, {
      subject: 'Updated Training',
      date: '2026-09-03',
      startTime: '20:00',
      endTime: '21:30',
      location: 'New Hall',
      description: 'Updated description',
    });

    assert.equal(response.status, 200);
    const updated = response.body.find(e => e.id === event.id);
    assert.deepEqual(updated, {
      id: event.id,
      categoryId: null,
      subject: 'Updated Training',
      date: '2026-09-03',
      startTime: '20:00',
      endTime: '21:30',
      location: 'New Hall',
      description: 'Updated description',
    });
  });

  test('EVENT-05 deletes an event', async () => {
    const response = await request('DELETE', `/api/teams/${team.slug}/events/${event.id}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.some(e => e.id === event.id), false);
    assert.equal(getDb().prepare('SELECT 1 FROM events WHERE id = ?').get(event.id), undefined);
  });

  test('ATT-01 sets yes, maybe and no attendance statuses', async () => {
    for (const status of ['yes', 'maybe', 'no']) {
      const response = await request('PUT', `/api/teams/${team.slug}/attendance/${person.id}/${event.id}`, { status });
      assert.equal(response.status, 200);

      const stored = getDb().prepare('SELECT status, note FROM attendance WHERE person_id = ? AND event_id = ?')
        .get(person.id, event.id);
      assert.deepEqual(stored, { status, note: '' });
    }
  });

  test('ATT-02 updates existing attendance instead of creating duplicates', async () => {
    await request('PUT', `/api/teams/${team.slug}/attendance/${person.id}/${event.id}`, {
      status: 'yes',
      note: 'Arrives late',
    });
    await request('PUT', `/api/teams/${team.slug}/attendance/${person.id}/${event.id}`, {
      status: 'maybe',
      note: 'May arrive late',
    });

    const rows = getDb().prepare('SELECT status, note FROM attendance WHERE person_id = ? AND event_id = ?')
      .all(person.id, event.id);
    assert.deepEqual(rows, [{ status: 'maybe', note: 'May arrive late' }]);
  });

  test('ATT-03 removes attendance when status is omitted', async () => {
    await request('PUT', `/api/teams/${team.slug}/attendance/${person.id}/${event.id}`, { status: 'yes' });
    const response = await request('PUT', `/api/teams/${team.slug}/attendance/${person.id}/${event.id}`, {});

    assert.equal(response.status, 200);
    assert.equal(getDb().prepare('SELECT 1 FROM attendance WHERE person_id = ? AND event_id = ?').get(person.id, event.id), undefined);
  });

  test('ATT-04 returns the team attendance matrix', async () => {
    await request('PUT', `/api/teams/${team.slug}/attendance/${person.id}/${event.id}`, {
      status: 'yes',
      note: 'On time',
    });

    const response = await request('GET', `/api/teams/${team.slug}/attendance`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      [person.id]: {
        [event.id]: { status: 'yes', note: 'On time' },
      },
    });
  });

  test('ATT-05 rejects attendance for a person who is not a team member', async () => {
    const outsider = seedPerson({ id: 'person-2', name: 'Outsider' });

    const response = await request('PUT', `/api/teams/${team.slug}/attendance/${outsider.id}/${event.id}`, {
      status: 'yes',
    });

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, { error: 'person or event not found in team' });
  });

  test('ATT-06 rejects attendance for an event belonging to another team', async () => {
    const otherTeam = seedTeam({ id: 'team-2', name: 'Other Team', slug: 'other-team' });
    const otherEvent = seedEvent({ id: 'event-2', teamId: otherTeam.id, subject: 'Other Event' });

    const response = await request('PUT', `/api/teams/${team.slug}/attendance/${person.id}/${otherEvent.id}`, {
      status: 'yes',
    });

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, { error: 'person or event not found in team' });
  });
});
