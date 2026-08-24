const express = require('express');
const path = require('path');
const config = require('./src/config');
const AppError = require('./src/errors');
const { getDb } = require('./src/db/connection');

// Opens the SQLite file, runs any pending schema migrations, and
// imports a legacy db.json if one is still present. Doing this
// explicitly up front — rather than relying on whichever repository
// happens to load first — means a migration/import failure crashes
// startup loudly instead of surfacing on some later, unrelated request.
getDb();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/state', require('./src/routes/stateRoutes'));
app.use('/api/persons', require('./src/routes/personsRoutes'));
app.use('/api/categories', require('./src/routes/categoriesRoutes'));
app.use('/api/events', require('./src/routes/eventsRoutes'));
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));
app.use('/api/staffAssignments', require('./src/routes/staffAssignmentsRoutes'));
app.use('/calendar', require('./src/routes/calendarRoutes'));

// Central error handler. Services throw AppError for expected/validation
// failures (bad input, not-found, etc.) — that's the only kind of error
// routes need to know how to render. Anything else is a genuine bug, so
// it's logged and reported as a generic 500 rather than leaking internals.
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(config.PORT, () => {
  console.log(`pandaplan listening on :${config.PORT}`);
});
