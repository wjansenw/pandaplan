const http = require('http');
const https = require('https');
const config = require('../config');

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '').replace(/\r?\n/g, '\n');
}

function unescapeIcs(value) {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

// Converts a genuine UTC instant (an ICS DTSTART/DTEND ending in "Z") to the
// wall-clock date and time a viewer in config.EVENT_TIMEZONE would see,
// correctly accounting for that zone's daylight-saving switch, if any.
// Recomputing both the date and time from the same converted instant
// (rather than just shifting the time string) also handles the rare case
// where the conversion crosses midnight.
function utcToLocal(dateStr, timeStr) {
  const instant = new Date(`${dateStr}T${timeStr}Z`);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.EVENT_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

function parseDateTime(value) {
  const clean = value.trim();
  if (/^\d{8}$/.test(clean)) return { date: `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`, time: '' };
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const time = `${match[4]}:${match[5]}:${match[6]}`;
  // A trailing "Z" means the ICS value is genuine UTC and must be converted.
  // No "Z" means either a floating local time or one already qualified by a
  // TZID parameter — both are already the intended local wall-clock time,
  // so no conversion is applied in that case.
  return match[7] ? utcToLocal(date, time) : { date, time };
}

function parseIcs(text) {
  const lines = unfold(text).split('\n');
  const events = [];
  let current = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue; }
    if (line === 'END:VEVENT') {
      if (current) {
        const start = parseDateTime(current.DTSTART || '');
        const end = parseDateTime(current.DTEND || '');
        if (start) events.push({
          subject: unescapeIcs(current.SUMMARY || '').trim(),
          date: start.date,
          startTime: start.time,
          endTime: end && end.time || '',
          location: unescapeIcs(current.LOCATION || '').trim(),
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).split(';')[0].toUpperCase();
    const value = line.slice(separator + 1);
    if (['SUMMARY', 'DTSTART', 'DTEND', 'LOCATION'].includes(key)) current[key] = value;
  }
  return events;
}

function fetchUrl(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  let parsed;
  try { parsed = new URL(url); } catch { return Promise.reject(new Error('Invalid ICS URL')); }
  if (!['http:', 'https:'].includes(parsed.protocol)) return Promise.reject(new Error('ICS URL must use HTTP or HTTPS'));
  const client = parsed.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.get(parsed, { headers: { Accept: 'text/calendar,text/plain;q=0.9,*/*;q=0.1' } }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        return fetchUrl(new URL(response.headers.location, parsed).toString(), redirects + 1).then(resolve, reject);
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        return reject(new Error(`ICS feed returned HTTP ${response.statusCode}`));
      }
      const chunks = [];
      response.setEncoding('utf8');
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(chunks.join('')));
    });
    request.setTimeout(15000, () => request.destroy(new Error('ICS feed request timed out')));
    request.on('error', reject);
  });
}

module.exports = { fetchUrl, parseIcs };
