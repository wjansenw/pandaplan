/* PandaPlan V2 frontend entry point. */
(function loadPandaPlanV2Scripts() {
  const common = [["/shared.js", false]];
  const pages = {
    "/teams.html": [["/about-nav.js", false], ["/v2/navigation.js", true], ["/shared-api.js", false], ["/v2/shared-team.js", false], ["/teams.js", false], ["/teams-api.js", false], ["/teams-render.js", false], ["/teams-controller.js", false]],
    "/team-overview.html": [["/about-nav.js", false], ["/v2/navigation.js", true], ["/shared-api.js", false], ["/v2/shared-team.js", false], ["/team-overview-api.js", false], ["/team-overview-staff.js", false], ["/bulk-attendance.js", false], ["/team-overview-render.js", false], ["/v2/team-overview.js", false]],
    "/team-people.html": [["/about-nav.js", false], ["/v2/navigation.js", true], ["/shared-api.js", false], ["/v2/shared-team.js", false], ["/team-people-api.js", false], ["/team-people-render.js", false], ["/team-people.js", false]],
    "/team-categories.html": [["/about-nav.js", false], ["/v2/navigation.js", true], ["/shared-api.js", false], ["/v2/shared-team.js", false], ["/team-categories-api.js", false], ["/team-categories-render.js", false], ["/team-categories.js", false]],
    "/team-events.html": [["/about-nav.js", false], ["/v2/navigation.js", true], ["/shared-api.js", false], ["/v2/shared-team.js", false], ["/team-events-api.js", false], ["/team-events-render.js", false], ["/v2/team-events.js", false]],
    "/about.html": [["/about-nav.js", false], ["/v2/navigation.js", true]],
  };
  window.pandaplanFrontendPrefix = "/v2";
  const pagePath = window.location.pathname.slice(3) || "/";
  const scripts = common.concat(pages[pagePath] || []);
  for (const [src, navigation] of scripts) {
    const attrs = navigation ? " data-navigation-js" : "";
    document.write(`<script src="${src}"${attrs}></script>`);
  }
})();
