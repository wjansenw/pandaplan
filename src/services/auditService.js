const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function log(req, action, details) {
  const hashedIp = hashIp(req.ip || req.connection.remoteAddress || 'unknown');
  const entry = {
    timestamp: new Date().toISOString(),
    hashedIp,
    action,
    details,
  };
  try {
    fs.appendFileSync(config.LOGS_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

module.exports = { log };
