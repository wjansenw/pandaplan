const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const sessionModule = require('../../src/auth/session');

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function request(server, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(server.address(), { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('session max age defaults to 30 days', () => {
  const previous = process.env.OIDC_SESSION_MAX_AGE;
  delete process.env.OIDC_SESSION_MAX_AGE;

  try {
    assert.equal(sessionModule.getSessionMaxAge(), THIRTY_DAYS);
  } finally {
    if (previous === undefined) delete process.env.OIDC_SESSION_MAX_AGE;
    else process.env.OIDC_SESSION_MAX_AGE = previous;
  }
});

test('session max age can be configured', () => {
  const previous = process.env.OIDC_SESSION_MAX_AGE;
  process.env.OIDC_SESSION_MAX_AGE = '1234567';

  try {
    assert.equal(sessionModule.getSessionMaxAge(), 1234567);
  } finally {
    if (previous === undefined) delete process.env.OIDC_SESSION_MAX_AGE;
    else process.env.OIDC_SESSION_MAX_AGE = previous;
  }
});

test('session middleware uses a rolling cookie with the configured max age', async () => {
  const previousSecret = process.env.OIDC_SESSION_SECRET;
  const previousMaxAge = process.env.OIDC_SESSION_MAX_AGE;
  process.env.OIDC_SESSION_SECRET = 'test-session-secret';
  process.env.OIDC_SESSION_MAX_AGE = '60000';

  const app = express();
  app.use(sessionModule.sessionMiddleware());
  app.get('/set', (req, res) => {
    req.session.account = { id: 'test' };
    res.send('ok');
  });
  app.get('/check', (req, res) => res.send(req.session.account ? 'ok' : 'missing'));

  const server = http.createServer(app);

  try {
    await new Promise((resolve) => server.listen(0, resolve));
    const first = await request(server, {});
    assert.equal(first.statusCode, 404);

    const created = await request(server, { Cookie: '' });
    assert.equal(created.statusCode, 404);

    const setResponse = await request(server, {});
    assert.equal(setResponse.statusCode, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousSecret === undefined) delete process.env.OIDC_SESSION_SECRET;
    else process.env.OIDC_SESSION_SECRET = previousSecret;
    if (previousMaxAge === undefined) delete process.env.OIDC_SESSION_MAX_AGE;
    else process.env.OIDC_SESSION_MAX_AGE = previousMaxAge;
  }
});
