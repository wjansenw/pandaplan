const session = require('express-session');

const DEFAULT_SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function getSessionMaxAge() {
  const configured = Number(process.env.OIDC_SESSION_MAX_AGE);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_SESSION_MAX_AGE;
}

function sessionMiddleware() {
  const sessionSecret = process.env.OIDC_SESSION_SECRET || process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error('OIDC_SESSION_SECRET or SESSION_SECRET must be configured');
  }

  return session({
    name: 'pandaplan_oidc',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: getSessionMaxAge(),
    },
  });
}

function requireAuthentication(req, res, next) {
  if (!req.session?.account) {
    // When this middleware is mounted at /api, Express strips the mount
    // path from req.path. Use originalUrl so API callers receive JSON 401
    // instead of being redirected to the OIDC login page.
    if (req.originalUrl.startsWith('/api/')) return res.status(401).json({ error: 'authentication required' });
    return res.redirect('/oidc');
  }
  next();
}

module.exports = { sessionMiddleware, requireAuthentication, getSessionMaxAge };
