const {
  SITE_ADMIN_ROLE,
  ALL_TEAM_ROLES,
  getRoleDefinition,
  isTeamRole,
  isSiteAdminRole,
  roleHasPermission,
} = require('./roles');

function hasGlobalAccess(account) {
  return Boolean(account?.isSiteAdmin);
}

function hasTeamRole(account, teamId, role) {
  if (!account || !teamId || !isTeamRole(role)) return false;
  if (hasGlobalAccess(account)) return true;
  return (account.teamRoles || []).some(
    (membership) => membership.teamId === teamId && membership.role === role,
  );
}

function can(account, teamId, permission) {
  if (!account) return false;
  if (hasGlobalAccess(account)) return true;
  return (account.teamRoles || []).some(
    (membership) =>
      membership.teamId === teamId &&
      roleHasPermission(membership.role, permission),
  );
}

function getAccountRoles(account, teamId) {
  if (!account) return [];
  if (hasGlobalAccess(account)) return [SITE_ADMIN_ROLE];
  return (account.teamRoles || [])
    .filter((membership) => membership.teamId === teamId)
    .map((membership) => membership.role);
}

module.exports = {
  SITE_ADMIN_ROLE,
  ALL_TEAM_ROLES,
  getRoleDefinition,
  isSiteAdminRole,
  hasGlobalAccess,
  hasTeamRole,
  can,
  getAccountRoles,
};
