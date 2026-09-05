/* PandaPlan V1 frontend entry point. Kept for the existing production URLs. */
(function loadPandaPlanScripts() {
  const pages = {
    "/teams.html": ["/shared.js", "/about-nav.js", "/navigation.js", "/shared-api.js", "/shared-team.js", "/teams.js", "/teams-api.js", "/teams-render.js", "/teams-controller.js"],
    "/team-overview.html": ["/shared.js", "/about-nav.js", "/navigation.js", "/shared-api.js", "/shared-team.js", "/team-overview-api.js", "/team-overview-staff.js", "/bulk-attendance.js", "/team-overview-render.js", "/team-overview.js"],
    "/team-events.html": ["/shared.js", "/about-nav.js", "/navigation.js", "/shared-api.js", "/shared-team.js", "/team-events-api.js", "/team-events-render.js", "/team-events.js"],
    "/team-people.html": ["/shared.js", "/about-nav.js", "/navigation.js", "/shared-api.js", "/shared-team.js", "/team-people-api.js", "/team-people-render.js", "/team-people.js"],
    "/team-categories.html": ["/shared.js", "/about-nav.js", "/navigation.js", "/shared-api.js", "/shared-team.js", "/team-categories-api.js", "/team-categories-render.js", "/team-categories.js"],
    "/about.html": ["/shared.js", "/about-nav.js", "/navigation.js"],
    "/oidc.html": ["/shared.js", "/oidc-i18n.js", "/oidc-role-i18n.js", "/navigation.js"],
    "/oidc": ["/shared.js", "/oidc-i18n.js", "/oidc-role-i18n.js", "/navigation.js"],
    "/oidc-users.html": ["/shared.js", "/oidc-i18n.js", "/navigation.js"],
    "/oidc/admin": ["/shared.js", "/oidc-i18n.js", "/navigation.js"]
  };
  for (const src of pages[window.location.pathname] || []) {
    const script = document.createElement("script");
    script.src = src;
    document.write(script.outerHTML);
  }
})();
