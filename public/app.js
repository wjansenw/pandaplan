/* PandaPlan V1 frontend entry point. Kept for the existing production URLs. */
(function loadPandaPlanScripts() {
  const pages = {
    "/team-overview.html": ["/shared.js", "/about-nav.js", "/navigation.js", "/shared-api.js", "/shared-team.js", "/team-overview-api.js", "/team-overview-staff.js", "/bulk-attendance.js", "/team-overview-render.js", "/team-overview.js"],
    "/team-events.html": ["/shared.js", "/about-nav.js", "/navigation.js", "/shared-api.js", "/shared-team.js", "/team-events-api.js", "/team-events-render.js", "/team-events.js"],
    "/about.html": ["/shared.js", "/about-nav.js", "/navigation.js"],
    "/oidc.html": ["/shared.js", "/oidc-i18n.js", "/oidc-role-i18n.js", "/navigation.js"],
    "/oidc-users.html": ["/shared.js", "/oidc-i18n.js", "/navigation.js"]
  };
  for (const src of pages[window.location.pathname] || []) {
    const script = document.createElement("script");
    script.src = src;
    document.write(script.outerHTML);
  }
})();
