const express = require('express');
const { Issuer, generators } = require('openid-client');
const path = require('path');
const accountsRepository = require('./repositories/accountsRepository');
const { hasGlobalAccess } = require('./auth/authorization');
const { sessionMiddleware } = require('./auth/session');

const router = express.Router();

const ISSUER_URL = process.env.OIDC_ISSUER_URL;
const CLIENT_ID = process.env.OIDC_CLIENT_ID;
const CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const REDIRECT_URI = process.env.OIDC_REDIRECT_URI;
const POST_LOGOUT_REDIRECT_URI = process.env.OIDC_POST_LOGOUT_REDIRECT_URI || '/oidc';
const OIDC_LOGOUT_URL = process.env.OIDC_LOGOUT_URL;

let clientPromise;

function configured() {
  return Boolean(ISSUER_URL && CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}

async function getClient() {
  if (!configured()) throw new Error('OIDC is not configured');
  if (!clientPromise) {
    clientPromise = Issuer.discover(ISSUER_URL).then((issuer) =>
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

function postLogoutRedirectUri(req) {
  return new URL(POST_LOGOUT_REDIRECT_URI, `${req.protocol}://${req.get('host')}`).toString();
}

function providerLogoutUrl(req) {
  if (!OIDC_LOGOUT_URL) return null;
  const url = new URL(OIDC_LOGOUT_URL);
  url.searchParams.set('rd', postLogoutRedirectUri(req));
  return url.toString();
}

function requireSiteAdmin(req, res, next) {
  if (!req.session.account || !hasGlobalAccess(req.session.account))
    return res.status(403).json({ error: 'site administrator access required' });
  next();
}

router.use(sessionMiddleware());
router.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'oidc.html')));
router.get('/admin', requireSiteAdmin, (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'oidc-users.html')));
router.get('/session', (req, res) => {
  if (!req.session.account) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: req.session.user, account: req.session.account });
});

router.get('/login', async (req, res, next) => {
  try {
    const client = await getClient();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();
    req.session.oidc = { codeVerifier, state, nonce };
    res.redirect(client.authorizationUrl({
      scope: 'openid profile email',
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/callback', async (req, res, next) => {
  try {
    const client = await getClient();
    const expected = req.session.oidc;
    if (!expected) return res.status(400).send('Missing OIDC login state');
    const tokenSet = await client.callback(REDIRECT_URI, client.callbackParams(req), {
      code_verifier: expected.codeVerifier,
      state: expected.state,
      nonce: expected.nonce,
    });
    const claims = { ...tokenSet.claims(), ...(await client.userinfo(tokenSet)) };
    const issuer = claims.iss || ISSUER_URL;
    const account = accountsRepository.findOrCreateFromOidc({
      provider: issuer,
      providerSubject: claims.sub,
      email: claims.email,
      name: claims.name || claims.preferred_username || claims.email || claims.sub,
    });
    req.session.oidc = undefined;
    req.session.user = { sub: claims.sub, name: account.name, email: account.email || null, issuer };
    req.session.account = account;
    req.session.idToken = tokenSet.id_token;
    res.redirect('/teams.html');
  } catch (error) {
    next(error);
  }
});

router.get('/admin/users', requireSiteAdmin, (req, res) => res.json({ users: accountsRepository.findAll() }));
router.get('/admin/teams', requireSiteAdmin, (req, res) => res.json({ teams: accountsRepository.listTeams() }));
router.put('/admin/users/:id/site-admin', requireSiteAdmin, (req, res, next) => {
  try {
    const account = accountsRepository.setSiteAdmin(req.params.id, Boolean(req.body.isSiteAdmin));
    if (!account) return res.status(404).json({ error: 'account not found' });
    res.json(account);
  } catch (error) {
    next(error);
  }
});
router.put('/admin/users/:id/team-role', requireSiteAdmin, (req, res, next) => {
  try {
    res.json(accountsRepository.setTeamRole(req.params.id, req.body.teamId, req.body.role ?? null));
  } catch (error) {
    next(error);
  }
});

async function logout(req, res, next) {
  try {
    const logoutUrl = providerLogoutUrl(req);
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('pandaplan_oidc');
      res.redirect(logoutUrl || postLogoutRedirectUri(req));
    });
  } catch (error) {
    next(error);
  }
}

router.get('/logout', logout);
router.post('/logout', logout);

module.exports = router;
