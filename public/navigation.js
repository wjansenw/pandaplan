(() => {
  const adminMode = new URLSearchParams(location.search).get("mode") === "admin";
  const path = location.pathname;
  const teamMatch = path.match(/^\/team\/([^/]+)/);
  const currentTeamSlug = teamMatch ? decodeURIComponent(teamMatch[1]) : null;
  const currentPage = teamMatch ? path.split("/")[3] || "overview" : null;

  const modeUrl = (url) =>
    adminMode ? url + (url.includes("?") ? "&" : "?") + "mode=admin" : url;

  function pageId(page) {
    const aliases = {
      overview: "overview",
      people: "people",
      events: "eventsLink",
      categories: "categories",
    };
    return aliases[page] || null;
  }

  function link(href, label, id, current = false, adminOnly = false) {
    const a = document.createElement("a");
    a.href = modeUrl(href);
    a.textContent = label;
    if (id) a.id = id;
    a.className = "sidebar-link";
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
    nav.className = "sidebar";
    nav.innerHTML = "";

    const header = document.createElement("div");
    header.className = "sidebar-header";

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.id = "brand";
    brand.href = modeUrl("/teams.html");
    brand.textContent = "🐼 pandaplan";
    header.appendChild(brand);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "sidebar-close";
    close.setAttribute("aria-label", "Close navigation");
    close.textContent = "×";
    header.appendChild(close);
    nav.appendChild(header);

    const menu = document.createElement("nav");
    menu.className = "sidebar-menu";
    menu.setAttribute("aria-label", "Main navigation");

    const teamsLink = link(
      "/teams.html",
      t("teams"),
      null,
      !currentTeamSlug && path === "/teams.html",
    );
    teamsLink.classList.add("sidebar-section-link");
    menu.appendChild(teamsLink);

    const teamList = document.createElement("div");
    teamList.className = "sidebar-team-list";

    (teams || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((team) => {
        const item = document.createElement("div");
        item.className = "sidebar-team";
        const isCurrent = team.slug === currentTeamSlug;
        if (isCurrent) item.classList.add("current-team", "open");

        const row = document.createElement("div");
        row.className = "sidebar-team-row";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "sidebar-team-toggle";
        toggle.setAttribute("aria-expanded", String(isCurrent));
        toggle.setAttribute("aria-label", `${team.name} ${isCurrent ? "expanded" : "collapsed"}`);
        toggle.textContent = isCurrent ? "▾" : "▸";
        row.appendChild(toggle);

        const teamLink = link(
          `/team/${encodeURIComponent(team.slug)}/overview`,
          team.name,
          null,
          isCurrent && currentPage === "overview",
        );
        teamLink.classList.add("sidebar-team-link");
        row.appendChild(teamLink);
        item.appendChild(row);

        const children = document.createElement("div");
        children.className = "sidebar-team-children";
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
              isCurrent ? pageId(page) : null,
              isCurrent && currentPage === page,
              adminOnly,
            ),
          );
        });
        item.appendChild(children);

        toggle.addEventListener("click", () => {
          const open = item.classList.toggle("open");
          toggle.textContent = open ? "▾" : "▸";
          toggle.setAttribute("aria-expanded", String(open));
        });

        teamList.appendChild(item);
      });

    menu.appendChild(teamList);

    const about = link("/about.html", t("about"), null, path === "/about.html");
    about.classList.add("sidebar-section-link");
    menu.appendChild(about);
    nav.appendChild(menu);

    const openButton = document.querySelector(".sidebar-open");
    const backdrop = document.querySelector(".sidebar-backdrop");
    const setMobileOpen = (open) => {
      nav.classList.toggle("mobile-open", open);
      if (backdrop) backdrop.hidden = !open;
    };
    close.addEventListener("click", () => setMobileOpen(false));
    if (openButton) openButton.onclick = () => setMobileOpen(true);
    if (backdrop) backdrop.onclick = () => setMobileOpen(false);
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
