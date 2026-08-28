// OIDC-specific translations follow the same language/fallback model as shared.js.
// Generic PandaPlan strings should continue to use t() from shared.js.
const OIDC_MESSAGES = {
  en: {
    oidcTitle: 'PandaPlan authentication',
    oidcChecking: 'Checking authentication…',
    oidcNotAuthenticated: 'You are not authenticated.',
    oidcAuthenticated: 'You are authenticated.',
    oidcLogin: 'Log in',
    oidcLogout: 'Log out',
    oidcName: 'Name',
    oidcEmail: 'Email',
    oidcSubject: 'Subject',
    oidcIssuer: 'Identity provider',
    oidcNoEmail: 'Not provided',
    oidcAuthError: 'Could not check authentication.',
    oidcUsersTitle: 'User management',
    oidcAuthentication: 'Authentication',
    oidcLoading: 'Loading…',
    oidcSiteAdmin: 'Site administrator',
    oidcNoAccess: 'No access',
    oidcTeamMember: 'Team Member',
    oidcStaffCoordinator: 'Staff Coordinator',
    oidcTeamManager: 'Team Manager',
    oidcSaveFailed: 'Could not update access.',
    oidcNoUsers: 'No users yet.',
    oidcNoTeams: 'No teams yet.',
    oidcProvider: 'Provider',
    oidcAccess: 'Team access',
  },
  'nl-BE': {
    oidcTitle: 'PandaPlan-authenticatie',
    oidcChecking: 'Authenticatie controleren…',
    oidcNotAuthenticated: 'Je bent niet geauthenticeerd.',
    oidcAuthenticated: 'Je bent geauthenticeerd.',
    oidcLogin: 'Inloggen',
    oidcLogout: 'Uitloggen',
    oidcName: 'Naam',
    oidcEmail: 'E-mail',
    oidcSubject: 'Subject',
    oidcIssuer: 'Identiteitsprovider',
    oidcNoEmail: 'Niet opgegeven',
    oidcAuthError: 'Authenticatie kon niet worden gecontroleerd.',
    oidcUsersTitle: 'Gebruikersbeheer',
    oidcAuthentication: 'Authenticatie',
    oidcLoading: 'Laden…',
    oidcSiteAdmin: 'Sitebeheerder',
    oidcNoAccess: 'Geen toegang',
    oidcTeamMember: 'Teamlid',
    oidcStaffCoordinator: 'Staffcoördinator',
    oidcTeamManager: 'Teammanager',
    oidcSaveFailed: 'Toegang kon niet worden bijgewerkt.',
    oidcNoUsers: 'Nog geen gebruikers.',
    oidcNoTeams: 'Nog geen teams.',
    oidcProvider: 'Provider',
    oidcAccess: 'Teamtoegang',
  },
};

function oidcLanguage() {
  const available = Object.keys(OIDC_MESSAGES);
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  for (const pref of prefs) {
    const lower = pref.toLowerCase();
    const exact = available.find((a) => a.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split('-')[0];
    const partial = available.find((a) => a.toLowerCase().split('-')[0] === base);
    if (partial) return partial;
  }
  return 'nl-BE';
}

function oidcT(key) {
  const language = oidcLanguage();
  return OIDC_MESSAGES[language]?.[key] ?? OIDC_MESSAGES['nl-BE']?.[key] ?? key;
}

function applyOidcTranslations(root = document) {
  root.querySelectorAll('[data-oidc-i18n]').forEach((element) => {
    element.textContent = oidcT(element.dataset.oidcI18n);
  });
}
