// Shared Team-page infrastructure for V2.
function getTeamSlug() {
  const prefix = window.pandaplanFrontendPrefix || "/v2";
  const pathname = location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) : location.pathname;
  return decodeURIComponent(pathname.split("/")[2] || "");
}
function teamBaseUrl(slug = getTeamSlug()) {
  const prefix = window.pandaplanFrontendPrefix || "/v2";
  return prefix + "/team/" + encodeURIComponent(slug);
}
function teamModeUrl(url) { return url; }
function teamApiUrl(path, slug = getTeamSlug()) {
  return "/api/teams/" + encodeURIComponent(slug) + (path ? "/" + path.replace(/^\//, "") : "");
}
function isTeamAdminMode() { return Boolean(window.pandaplanAuth?.authenticated && window.pandaplanAuth.account?.isSiteAdmin); }
function applyTeamAdminVisibility(adminMode = isTeamAdminMode()) { document.querySelectorAll("[data-admin-only]").forEach((el) => { el.hidden = !adminMode; }); }
function setTeamNavigation(slug = getTeamSlug(), adminMode = isTeamAdminMode()) {
  const base = teamBaseUrl(slug);
  const links = { brand: base + "/overview", overview: base + "/overview", overviewLink: base + "/overview", events: base + "/events", eventsLink: base + "/events", people: base + "/people", peopleLink: base + "/people", categories: base + "/categories", categoriesLink: base + "/categories" };
  Object.entries(links).forEach(([id, url]) => { const el = document.getElementById(id); if (el) el.href = teamModeUrl(url); });
  applyTeamAdminVisibility(adminMode);
}
