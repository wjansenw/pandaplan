const teamsRepository = require('../repositories/teamsRepository');
const personsRepository = require('../repositories/personsRepository');
const AppError = require('../errors');
const config = require('../config');
const { generateId } = require('../utils/id');
const { sanitizeRoles } = require('../utils/roles');

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-').slice(0, 100);
}

function validateSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9](?:[a-z0-9]|-(?!-)){0,98}[a-z0-9]$/.test(slug) && slug.length <= 100;
}

function getBySlug(slug) {
  const team = teamsRepository.findBySlug(slug);
  if (!team) throw new AppError(404, 'team not found');
  return team;
}

function create({ name, slug, description }) {
  const cleanName = (name || '').trim();
  if (!cleanName) throw new AppError(400, 'name is required');
  const cleanSlug = slugify(slug || cleanName);
  if (!validateSlug(cleanSlug)) throw new AppError(400, 'invalid slug');
  if (teamsRepository.findBySlug(cleanSlug)) throw new AppError(409, `slug "${cleanSlug}" is already in use`);
  if ((description || '').length > 500) throw new AppError(400, 'description must be at most 500 characters');
  return teamsRepository.create({ id: generateId(), name: cleanName, slug: cleanSlug, description: description || '' });
}

function update(slug, { name, newSlug, description }) {
  const team = getBySlug(slug);
  const cleanName = (name || '').trim();
  const cleanSlug = slugify(newSlug || team.slug);
  if (!cleanName) throw new AppError(400, 'name is required');
  if (!validateSlug(cleanSlug)) throw new AppError(400, 'invalid slug');
  const other = teamsRepository.findBySlug(cleanSlug);
  if (other && other.id !== team.id) throw new AppError(409, `slug "${cleanSlug}" is already in use`);
  if ((description || '').length > 500) throw new AppError(400, 'description must be at most 500 characters');
  return teamsRepository.update(team.id, { name: cleanName, slug: cleanSlug, description: description || '' });
}

function remove(slug) {
  const team = getBySlug(slug);
  if (teamsRepository.count() <= 1) throw new AppError(400, 'cannot delete the last team');

  const db = require('../db/connection').getDb();
  const members = db.prepare(`
    SELECT person_id
    FROM team_memberships
    WHERE team_id = ?
  `).all(team.id);

  db.transaction(() => {
    db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);

    for (const { person_id: personId } of members) {
      const remaining = db.prepare(`
        SELECT COUNT(*) AS n
        FROM team_memberships
        WHERE person_id = ?
      `).get(personId).n;

      if (remaining === 0) {
        db.prepare('DELETE FROM persons WHERE id = ?').run(personId);
      }
    }
  })();
}

function addExistingMember(slug, personId) {
  const team = getBySlug(slug);
  if (!personsRepository.findById(personId)) throw new AppError(404, 'person not found');
  if (teamsRepository.isMember(team.id, personId)) throw new AppError(409, 'person is already a member of this team');
  teamsRepository.addMember(team.id, personId, [config.PARTICIPANT_ROLE]);
  return teamsRepository.findMembers(team.id);
}

function removeMember(slug, personId) {
  const team = getBySlug(slug);
  if (!teamsRepository.isMember(team.id, personId)) throw new AppError(404, 'team membership not found');
  const db = require('../db/connection').getDb();
  const remainingTeams = db.prepare('SELECT COUNT(*) AS n FROM team_memberships WHERE person_id = ?').get(personId).n;
  if (remainingTeams <= 1) throw new AppError(400, 'person must belong to at least one team');
  teamsRepository.removeMember(team.id, personId);
  return teamsRepository.findMembers(team.id);
}

function setRoles(slug, personId, roles) {
  const team = getBySlug(slug);
  if (!teamsRepository.isMember(team.id, personId)) throw new AppError(404, 'team membership not found');
  const clean = sanitizeRoles(roles, config.ALL_ROLE_IDS);
  if (!clean || !clean.length) throw new AppError(400, 'at least one role is required');
  teamsRepository.setRoles(team.id, personId, clean);
  return teamsRepository.findMembers(team.id);
}

module.exports = { getBySlug, create, update, remove, addExistingMember, removeMember, setRoles, slugify };
