const session = require('express-session');

const SESSION_SECRET = process.env.OIDC_SESSION_SECRET || process.env.SESSION_SECRET;

function sessionMiddleware() {
  if (!SESSION_SECRET) {
    throw new Error('OIDC_SESSION_SECRET or SESSION_SECRET must be configured');
  }

  return session({
    name: 'pandaplan_oidc',
    secret: SESSION_SECRET,
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

module.exports = { sessionMiddleware, requireAuthentication };
