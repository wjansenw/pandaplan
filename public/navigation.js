(() => {
  const adminMode = new URLSearchParams(location.search).get("mode") === "admin";
  const path = location.pathname;
  const teamMatch = path.match(/^\/team\/([^/]+)/);
  const currentTeamSlug = teamMatch ? decodeURIComponent(teamMatch[1]) : null;
  const currentPage = teamMatch ? path.split("/")[3] || "overview" : null;

  const modeUrl = (url) =>
    adminMode ? url + (url.includes("?") ? "&" : "?") + "mode=admin" : url;

  function link(href, label, id, current = false, adminOnly = false) {
    const a = document.createElement("a");
    a.href = modeUrl(href);
    a.textContent = label;
    if (id) a.id = id;
    if (current) a.classList.add("current");
    if (adminOnly) {
      a.dataset.adminOnly = "true";
      a.hidden = !adminMode;
    }
    return a;
  }

  function render(teams) {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    nav.innerHTML = "";

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.id = "brand";
    brand.href = modeUrl("/teams.html");
    brand.textContent = "🐼 pandaplan";
    nav.appendChild(brand);

    const menu = document.createElement("nav");
    menu.className = "app-nav";
    menu.setAttribute("aria-label", "Main navigation");

    const teamsSection = document.createElement("div");
    teamsSection.className = "nav-section";
    const teamsLink = link("/teams.html", t("teams"), "teamsLink", !currentTeamSlug && path === "/teams.html");
    teamsSection.appendChild(teamsLink);

    const teamList = document.createElement("div");
    teamList.className = "nav-team-list";

    (teams || []).forEach((team) => {
      const item = document.createElement("div");
      item.className = "nav-team";
      if (team.slug === currentTeamSlug) item.classList.add("current-team");

      const teamLink = link(
        `/team/${encodeURIComponent(team.slug)}/overview`,
        team.name,
        null,
        team.slug === currentTeamSlug && currentPage === "overview",
      );
      teamLink.className = "nav-team-link" + (team.slug === currentTeamSlug && !currentPage ? " current" : "");
      item.appendChild(teamLink);

      const children = document.createElement("div");
      children.className = "nav-team-children";
      if (team.slug === currentTeamSlug) children.classList.add("open");

      const overview = link(
        `/team/${encodeURIComponent(team.slug)}/overview`,
        t("overview"),
        "overview",
        team.slug === currentTeamSlug && currentPage === "overview",
      );
      children.appendChild(overview);

      children.appendChild(link(
        `/team/${encodeURIComponent(team.slug)}/people`,
        t("people"),
        "people",
        team.slug === currentTeamSlug && currentPage === "people",
        true,
      ));
      children.appendChild(link(
        `/team/${encodeURIComponent(team.slug)}/events`,
        t("events"),
        "eventsLink",
        team.slug === currentTeamSlug && currentPage === "events",
        true,
      ));
      children.appendChild(link(
        `/team/${encodeURIComponent(team.slug)}/categories`,
        t("categories"),
        "categories",
        team.slug === currentTeamSlug && currentPage === "categories",
        true,
      ));

      item.appendChild(children);
      teamList.appendChild(item);
    });

    teamsSection.appendChild(teamList);
    menu.appendChild(teamsSection);

    const about = link("/about.html", t("about"), "aboutLink", path === "/about.html");
    menu.appendChild(about);

    nav.appendChild(menu);
  }

  async function init() {
    try {
      const teams = await api("/api/teams");
      render(teams);
    } catch (error) {
      console.error("Could not load navigation teams:", error);
      render([]);
    }
  }

  init();
})();
