const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');
const AppError = require('./src/errors');
const { getDb } = require('./src/db/connection');
const { sessionMiddleware, requireAuthentication } = require('./src/auth/session');
const { requireSiteAdmin, requireTeamReadWrite } = require('./src/auth/middleware');
const packageJson = require('./package.json');

function createApp(options = {}) {
  getDb();

  const app = express();
  app.use(express.json());
  app.use(sessionMiddleware());

  if (typeof options.testAccountProvider === 'function') {
    app.use((req, res, next) => {
      req.session.account = options.testAccountProvider(req);
      next();
    });
  }

  const teamPages = {
    overview: 'team-overview.html',
    events: 'team-events.html',
    people: 'team-people.html',
    categories: 'team-categories.html',
  };

  app.use('/oidc', require('./src/oidc'));

  // V2 is an isolated frontend entry point. It uses the same API, session and
  // database as the normal frontend; existing production URLs are untouched.
  const v2Pages = {
    teams: 'teams.html',
    about: 'about.html',
  };
  function sendV2Page(file, res) {
    const source = fs.readFileSync(path.join(__dirname, 'public', file), 'utf8');
    res.type('html').send(source.replace(/<script src="\/app\.js"><\/script>/g, '<script src="/v2/app.js"></script>'));
  }
  Object.entries(v2Pages).forEach(([page, file]) => {
    app.get(`/v2/${page}.html`, requireAuthentication, (req, res) => sendV2Page(file, res));
  });
  Object.entries(teamPages).forEach(([page, file]) => {
    app.get(`/v2/team/:slug/${page}`, requireAuthentication, (req, res) => sendV2Page(file, res));
  });

  app.get('/v2/team-events.js', requireAuthentication, (req, res) => {
    const source = fs.readFileSync(path.join(__dirname, 'public', 'team-events.js'), 'utf8');
    const v2 = source
      .replace('const slug = decodeURIComponent(location.pathname.split("/")[2] || "");', 'const v2Path = location.pathname.slice((window.pandaplanFrontendPrefix || "").length);\nconst slug = decodeURIComponent(v2Path.split("/")[2] || "");')
      .replace('const base = "/team/" + encodeURIComponent(pageState.team.slug);', 'const base = (window.pandaplanFrontendPrefix || "") + "/team/" + encodeURIComponent(pageState.team.slug);');
    res.type('application/javascript').send(v2);
  });

  app.get('/', requireAuthentication, (req, res) => res.redirect('/teams.html'));
  app.get('/team/:slug', requireAuthentication, (req, res) => {
    res.redirect(`/team/${encodeURIComponent(req.params.slug)}/overview`);
  });
  Object.entries(teamPages).forEach(([page, file]) => {
    app.get(`/team/:slug/${page}`, requireAuthentication, (req, res) =>
      res.sendFile(path.join(__dirname, 'public', file)),
    );
  });

  app.get('/teams.html', requireAuthentication, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'teams.html')),
  );
  app.get('/about.html', requireAuthentication, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'about.html')),
  );

  app.use((req, res, next) => {
    const publicHtml = new Set(['/oidc.html', '/oidc-users.html']);
    if (req.path.endsWith('.html') && !publicHtml.has(req.path)) return requireAuthentication(req, res, next);
    next();
  });

  app.get('/favicon.ico', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'favicon.svg')),
  );
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/version', (req, res) => res.json({ version: packageJson.version }));

  app.use('/api', requireAuthentication);
  app.use('/api/state', requireSiteAdmin, require('./src/routes/stateRoutes'));
  app.use('/api/persons', requireSiteAdmin, require('./src/routes/personsRoutes'));
  app.use('/api/teams', require('./src/routes/teamsRoutes'));
  app.use('/api/teams/:slug/state', requireTeamReadWrite('team:view', 'team:view'), require('./src/routes/teamStateRoutes'));
  app.use('/api/teams/:slug/persons', requireTeamReadWrite('team:view', 'people:manage'), require('./src/routes/teamPersonsRoutes'));
  app.use('/api/teams/:slug/categories', requireTeamReadWrite('team:view', 'categories:manage'), require('./src/routes/teamCategoriesRoutes'));
  app.use('/api/teams/:slug/events', requireTeamReadWrite('team:view', 'events:manage'), require('./src/routes/teamEventsRoutes'));
  app.use('/api/teams/:slug/attendance', requireTeamReadWrite('team:view', 'roster:manage'), require('./src/routes/teamAttendanceRoutes'));
  app.use('/api/teams/:slug/staffAssignments', requireTeamReadWrite('team:view', 'roster:manage'), require('./src/routes/teamStaffAssignmentsRoutes'));
  app.use('/calendar', require('./src/routes/calendarRoutes'));

  app.use((err, req, res, next) => {
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(config.PORT, () => console.log(`pandaplan listening on :${config.PORT}`));
}

module.exports = { createApp };
