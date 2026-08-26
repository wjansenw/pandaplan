// Shared Team-page infrastructure.
function getTeamSlug() {
  return decodeURIComponent(location.pathname.split("/")[2] || "");
}

function teamBaseUrl(slug = getTeamSlug()) {
  return "/team/" + encodeURIComponent(slug);
}

function teamModeUrl(url, adminMode = new URLSearchParams(location.search).get("mode") === "admin") {
  if (!adminMode) return url;
  return url + (url.includes("?") ? "&" : "?") + "mode=admin";
}

function teamApiUrl(path, slug = getTeamSlug()) {
  return "/api/teams/" + encodeURIComponent(slug) + (path ? "/" + path.replace(/^\//, "") : "");
}

function isTeamAdminMode() {
  return new URLSearchParams(location.search).get("mode") === "admin";
}

function applyTeamAdminVisibility(adminMode = isTeamAdminMode()) {
  document.querySelectorAll("[data-admin-only]").forEach((el) => {
    el.hidden = !adminMode;
  });
}

function setTeamNavigation(slug = getTeamSlug(), adminMode = isTeamAdminMode()) {
  const base = teamBaseUrl(slug);
  const links = {
    brand: base + "/overview",
    overview: base + "/overview",
    overviewLink: base + "/overview",
    events: base + "/events",
    eventsLink: base + "/events",
    people: base + "/people",
    peopleLink: base + "/people",
    categories: base + "/categories",
    categoriesLink: base + "/categories",
  };
  Object.entries(links).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el) el.href = teamModeUrl(url, adminMode);
  });
  applyTeamAdminVisibility(adminMode);
}
