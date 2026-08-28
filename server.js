const express = require('express');
const path = require('path');
const config = require('./src/config');
const AppError = require('./src/errors');
const { getDb } = require('./src/db/connection');
const { sessionMiddleware, requireAuthentication } = require('./src/auth/session');
const packageJson = require('./package.json');

getDb();

const app = express();
app.use(express.json());
app.use(sessionMiddleware());

const teamPages = {
  overview: 'team-overview.html',
  events: 'team-events.html',
  people: 'team-people.html',
  categories: 'team-categories.html',
};

app.use('/oidc', require('./src/oidc'));

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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/version', (req, res) => res.json({ version: packageJson.version }));

app.use('/api', requireAuthentication);
app.use('/api/state', require('./src/routes/stateRoutes'));
app.use('/api/persons', require('./src/routes/personsRoutes'));
app.use('/api/teams', require('./src/routes/teamsRoutes'));
app.use('/api/teams/:slug/state', require('./src/routes/teamStateRoutes'));
app.use('/api/teams/:slug/persons', require('./src/routes/teamPersonsRoutes'));
app.use('/api/teams/:slug/categories', require('./src/routes/teamCategoriesRoutes'));
app.use('/api/teams/:slug/events', require('./src/routes/teamEventsRoutes'));
app.use('/api/teams/:slug/attendance', require('./src/routes/teamAttendanceRoutes'));
app.use('/api/teams/:slug/staffAssignments', require('./src/routes/teamStaffAssignmentsRoutes'));
app.use('/calendar', requireAuthentication, require('./src/routes/calendarRoutes'));

app.use((err, req, res, next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(config.PORT, () => console.log(`pandaplan listening on :${config.PORT}`));
