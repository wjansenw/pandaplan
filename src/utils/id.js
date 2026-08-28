const crypto = require('crypto');

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Used for calendar feed tokens: these stand in as the sole credential
// for an unauthenticated URL, so unlike generateId() they must come
// from a CSPRNG, not Math.random() or a predictable timestamp prefix.
function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

module.exports = { generateId, generateToken };
