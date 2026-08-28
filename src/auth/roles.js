// PandaPlan authorization roles.
// These are foundations only: existing API routes and UI do not use them yet.

const SITE_ADMIN_ROLE = 'site_admin';

const TEAM_ROLES = Object.freeze({
  TEAM_MEMBER: 'team_member',
  STAFF_COORDINATOR: 'staff_coordinator',
  TEAM_MANAGER: 'team_manager',
});

const ALL_TEAM_ROLES = Object.freeze(Object.values(TEAM_ROLES));
const ALL_ROLES = Object.freeze([SITE_ADMIN_ROLE, ...ALL_TEAM_ROLES]);

const ROLE_DEFINITIONS = Object.freeze({
  [SITE_ADMIN_ROLE]: Object.freeze({
    scope: 'global',
    permissions: Object.freeze(['*']),
  }),
  [TEAM_ROLES.TEAM_MEMBER]: Object.freeze({
    scope: 'team',
    permissions: Object.freeze(['team:view', 'attendance:manage']),
  }),
  [TEAM_ROLES.STAFF_COORDINATOR]: Object.freeze({
    scope: 'team',
    permissions: Object.freeze(['team:view', 'staff:manage']),
  }),
  [TEAM_ROLES.TEAM_MANAGER]: Object.freeze({
    scope: 'team',
    permissions: Object.freeze(['team:view', 'attendance:manage', 'people:manage', 'events:manage', 'staff:manage', 'categories:manage']),
  }),
});

function isValidRole(role) {
  return ALL_ROLES.includes(role);
}

function isTeamRole(role) {
  return ALL_TEAM_ROLES.includes(role);
}

function isSiteAdminRole(role) {
  return role === SITE_ADMIN_ROLE;
}

function getRoleDefinition(role) {
  return ROLE_DEFINITIONS[role] || null;
}

function roleHasPermission(role, permission) {
  const definition = getRoleDefinition(role);
  return Boolean(definition && (definition.permissions.includes('*') || definition.permissions.includes(permission)));
}

module.exports = {
  SITE_ADMIN_ROLE,
  TEAM_ROLES,
  ALL_TEAM_ROLES,
  ALL_ROLES,
  ROLE_DEFINITIONS,
  isValidRole,
  isTeamRole,
  isSiteAdminRole,
  getRoleDefinition,
  roleHasPermission,
};
