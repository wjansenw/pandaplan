// Filters `input` down to only values present in `allowed`, deduped.
// Returns null (not an empty array) if `input` isn't an array at all —
// callers use that distinction to tell "not provided" apart from
// "provided but empty".
function sanitizeRoles(input, allowed) {
  if (!Array.isArray(input)) return null;
  const set = new Set(input.filter((r) => allowed.includes(r)));
  return Array.from(set);
}

module.exports = { sanitizeRoles };
