const { can, hasGlobalAccess } = require('./authorization');
const teamService = require('../services/teamService');

function requireSiteAdmin(req, res, next) {
  if (!hasGlobalAccess(req.session.account)) return res.status(403).json({ error: 'site administrator access required' });
  next();
}

function requireTeamPermission(permission) {
  return (req, res, next) => {
    try {
      const team = teamService.getBySlug(req.params.slug);
      if (!can(req.session.account, team.id, permission)) {
        return res.status(403).json({ error: 'insufficient team permissions' });
      }
      req.team = team;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { requireSiteAdmin, requireTeamPermission };
