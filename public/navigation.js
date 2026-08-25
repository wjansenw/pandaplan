(() => {
  const adminMode = new URLSearchParams(location.search).get("mode") === "admin";
  const path = location.pathname;
  const teamMatch = path.match(/^\/team\/([^/]+)/);
  const currentTeamSlug = teamMatch ? decodeURIComponent(teamMatch[1]) : null;
  const currentPage = teamMatch ? path.split("/")[3] || "overview" : null;

  const modeUrl = (url) =>
    adminMode ? url + (url.includes("?") ? "&" : "?") + "mode=admin" : url;

  function pageId(page) {
    if (page === currentPage) return null;
    const aliases = {
      overview: "overviewLink",
      people: "peopleLink",
      events: "eventsLink",
      categories: "categoriesLink",
    };
    return currentPage === "overview" ? {
      overview: "overview",
      people: "people",
      events: "eventsLink",
      categories: "categories",
    }[page] : aliases[page];
  }

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
    teamsSection.appendChild(
      link("/teams.html", t("teams"), null, !currentTeamSlug && path === "/teams.html"),
    );

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
      teamLink.classList.add("nav-team-link");
      item.appendChild(teamLink);

      const children = document.createElement("div");
      children.className = "nav-team-children";
      if (team.slug === currentTeamSlug) children.classList.add("open");

      const pages = [
        ["overview", t("overview"), false],
        ["people", t("peopleNav") || t("people"), true],
        ["events", t("events"), true],
        ["categories", t("categories"), true],
      ];
      pages.forEach(([page, label, adminOnly]) => {
        children.appendChild(
          link(
            `/team/${encodeURIComponent(team.slug)}/${page}`,
            label,
            team.slug === currentTeamSlug ? pageId(page) : null,
            team.slug === currentTeamSlug && currentPage === page,
            adminOnly,
          ),
        );
      });

      item.appendChild(children);
      teamList.appendChild(item);
    });

    teamsSection.appendChild(teamList);
    menu.appendChild(teamsSection);
    menu.appendChild(link("/about.html", t("about"), null, path === "/about.html"));
    nav.appendChild(menu);
  }

  async function init() {
    try {
      render(await api("/api/teams"));
    } catch (error) {
      console.error("Could not load navigation teams:", error);
      render([]);
    }
  }

  init();
})();
