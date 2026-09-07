const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const sessionModule = require('../../src/auth/session');

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function request(server, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request({ hostname: address.address, port: address.port, path, headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('session max age defaults to 30 days', () => {
  const previous = process.env.OIDC_SESSION_MAX_AGE;
  delete process.env.OIDC_SESSION_MAX_AGE;

  try {
    assert.equal(sessionModule.getSessionMaxAge(), THIRTY_DAYS);
  } finally {
    restoreEnv('OIDC_SESSION_MAX_AGE', previous);
  }
});

test('session max age can be configured', () => {
  const previous = process.env.OIDC_SESSION_MAX_AGE;
  process.env.OIDC_SESSION_MAX_AGE = '1234567';

  try {
    assert.equal(sessionModule.getSessionMaxAge(), 1234567);
  } finally {
    restoreEnv('OIDC_SESSION_MAX_AGE', previous);
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
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));const first = await request(server, '/set');
    assert.equal(first.statusCode, 200);

    const firstCookie = first.headers['set-cookie'][0];
    assert.match(firstCookie, /Expires=/);

    const firstExpires = new Date(firstCookie.match(/Expires=([^;]+)/)[1]).getTime();
    const firstNow = Date.now();

    assert.ok(
       firstExpires >= firstNow + 55000 &&
       firstExpires <= firstNow + 65000,
       `expected cookie expiry about 60 seconds from now, got ${firstCookie}`
    );

    const cookie = firstCookie.split(';')[0];

    const second = await request(server, '/check', { Cookie: cookie });
    assert.equal(second.statusCode, 200);
    assert.equal(second.body, 'ok');

    const secondCookie = second.headers['set-cookie'][0];
    assert.match(secondCookie, /Expires=/);

    const secondExpires = new Date(secondCookie.match(/Expires=([^;]+)/)[1]).getTime();
    const secondNow = Date.now();

    assert.ok(
       secondExpires >= secondNow + 55000 &&
       secondExpires <= secondNow + 65000,
       `expected rolling cookie expiry about 60 seconds from now, got ${secondCookie}`
    );

  } finally {
    await new Promise((resolve) => server.close(resolve));
    restoreEnv('OIDC_SESSION_SECRET', previousSecret);
    restoreEnv('OIDC_SESSION_MAX_AGE', previousMaxAge);
  }
});
