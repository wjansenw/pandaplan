const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');

const router = express.Router();

const SESSION_SECRET = process.env.OIDC_SESSION_SECRET || process.env.SESSION_SECRET;
const ISSUER_URL = process.env.OIDC_ISSUER_URL;
const CLIENT_ID = process.env.OIDC_CLIENT_ID;
const CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const REDIRECT_URI = process.env.OIDC_REDIRECT_URI || '/oidc/callback';

let clientPromise;

function configured() {
  return Boolean(SESSION_SECRET && ISSUER_URL && CLIENT_ID && CLIENT_SECRET);
}

function sessionMiddleware() {
  return session({
    name: 'pandaplan_oidc',
    secret: SESSION_SECRET || 'oidc-not-configured',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    },
  });
}

async function getClient() {
  if (!configured()) throw new Error('OIDC is not configured');
  if (!clientPromise) {
    clientPromise = Issuer.discover(ISSUER_URL).then(
      (issuer) =>
        new issuer.Client({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uris: [REDIRECT_URI],
          response_types: ['code'],
        }),
    );
  }
  return clientPromise;
}

router.use(sessionMiddleware());

router.get('/', (req, res) => {
  res.sendFile(require('path').join(__dirname, '..', 'public', 'oidc.html'));
});

router.get('/session', (req, res) => {
  if (!req.session.user) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: req.session.user });
});

router.get('/login', async (req, res, next) => {
  try {
    const client = await getClient();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    req.session.oidc = { codeVerifier, state, nonce };

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid profile email',
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    res.redirect(authorizationUrl);
  } catch (error) {
    next(error);
  }
});

router.get('/callback', async (req, res, next) => {
  try {
    const client = await getClient();
    const expected = req.session.oidc;
    if (!expected) return res.status(400).send('Missing OIDC login state');

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(REDIRECT_URI, params, {
      code_verifier: expected.codeVerifier,
      state: expected.state,
      nonce: expected.nonce,
    });

    const claims = tokenSet.claims();
    req.session.oidc = undefined;
    req.session.user = {
      sub: claims.sub,
      name: claims.name || claims.preferred_username || claims.email || claims.sub,
      email: claims.email || null,
      issuer: claims.iss || ISSUER_URL,
    };

    res.redirect('/oidc');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('pandaplan_oidc');
    res.redirect('/oidc');
  });
});

module.exports = router;
module.exports.configured = configured;
