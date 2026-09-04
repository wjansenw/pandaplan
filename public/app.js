/*
 * PandaPlan frontend entry point.
 *
 * Keep the HTML pages declarative: each page loads only this file.  The
 * loader preserves the existing script order and therefore the existing
 * global APIs used by the page modules.
 */
(function loadPandaPlanScripts() {
  const common = [["/shared.js", false]];
  const pages = {
    "/teams.html": [
      ["/about-nav.js", false], ["/navigation.js", true], ["/shared-api.js", false],
      ["/shared-team.js", false], ["/teams.js", false], ["/teams-api.js", false],
      ["/teams-render.js", false], ["/teams-controller.js", false],
    ],
    "/team-overview.html": [
      ["/about-nav.js", false], ["/navigation.js", true], ["/shared-api.js", false],
      ["/shared-team.js", false], ["/team-overview-api.js", false], ["/team-overview-staff.js", false],
      ["/bulk-attendance.js", false], ["/team-overview-render.js", false], ["/team-overview.js", false],
    ],
    "/team-people.html": [
      ["/about-nav.js", false], ["/navigation.js", true], ["/shared-api.js", false],
      ["/shared-team.js", false], ["/team-people-api.js", false], ["/team-people-render.js", false],
      ["/team-people.js", false],
    ],
    "/team-categories.html": [
      ["/about-nav.js", false], ["/navigation.js", true], ["/shared-api.js", false],
      ["/shared-team.js", false], ["/team-categories-api.js", false], ["/team-categories-render.js", false],
      ["/team-categories.js", false],
    ],
    "/team-events.html": [
      ["/about-nav.js", false], ["/navigation.js", true], ["/shared-api.js", false],
      ["/shared-team.js", false], ["/team-events-api.js", false], ["/team-events-render.js", false],
      ["/team-events.js", false],
    ],
    "/about.html": [["/about-nav.js", false], ["/navigation.js", true]],
    "/oidc.html": [["/oidc-i18n.js", false], ["/oidc-role-i18n.js", false], ["/navigation.js", true]],
    "/oidc-users.html": [["/oidc-i18n.js", false], ["/navigation.js", true]],
  };

  const isV2 = window.location.pathname === "/v2" || window.location.pathname.startsWith("/v2/");
  window.pandaplanFrontendPrefix = isV2 ? "/v2" : "";
  const pagePath = isV2 ? window.location.pathname.slice(3) || "/" : window.location.pathname;
  const scripts = common.concat(pages[pagePath] || []);

  for (const [src, navigation] of scripts) {
    const attrs = navigation ? " data-navigation-js" : "";
    document.write(`<script src="${src}"${attrs}></script>`);
  }
})();
