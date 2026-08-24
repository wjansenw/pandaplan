const express = require('express');
const path = require('path');
const config = require('./src/config');
const AppError = require('./src/errors');
const { getDb } = require('./src/db/connection');

getDb();

const app = express();
app.use(express.json());

// Team URLs are intentionally stable and scoped by slug. Keep the slug in
// the browser URL so users don't accidentally navigate into another Team.
const teamPages = {
  overview: 'team-overview.html',
  attend: 'team-attend.html',
  events: 'team-events.html',
  people: 'team-people.html',
  categories: 'team-categories.html',
  staff: 'team-staff.html',
};
app.get('/team/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'team.html')));
Object.entries(teamPages).forEach(([page, file]) => {
  app.get(`/team/:slug/${page}`, (req, res) => res.sendFile(path.join(__dirname, 'public', file)));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/state', require('./src/routes/stateRoutes'));
app.use('/api/persons', require('./src/routes/personsRoutes'));
app.use('/api/teams', require('./src/routes/teamsRoutes'));
app.use('/api/teams/:slug/state', require('./src/routes/teamStateRoutes'));
app.use('/api/teams/:slug/persons', require('./src/routes/teamPersonsRoutes'));
app.use('/api/teams/:slug/categories', require('./src/routes/teamCategoriesRoutes'));
app.use('/api/teams/:slug/events', require('./src/routes/teamEventsRoutes'));
app.use('/api/teams/:slug/attendance', require('./src/routes/teamAttendanceRoutes'));
app.use('/api/teams/:slug/staffAssignments', require('./src/routes/teamStaffAssignmentsRoutes'));
app.use('/calendar', require('./src/routes/calendarRoutes'));

app.use((err, req, res, next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(config.PORT, () => console.log(`pandaplan listening on :${config.PORT}`));
