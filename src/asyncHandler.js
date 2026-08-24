// Express doesn't automatically forward rejected promises from async
// route handlers to error middleware — an unhandled rejection there can
// hang the request or, in older Express/Node combinations, crash the
// process. Wrapping every handler in this wires that up correctly with
// no per-route try/catch boilerplate.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
