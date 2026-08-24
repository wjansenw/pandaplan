// Thrown by services for expected/validation failures. Routes never
// build error responses themselves — they let this propagate to the
// central error-handling middleware in server.js, which maps `.status`
// to the HTTP response. This keeps services free of any Express
// knowledge (req/res), so they stay easy to test and reuse.
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

module.exports = AppError;
