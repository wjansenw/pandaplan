(() => {
  const adminMode = new URLSearchParams(location.search).get("mode") === "admin";
  const path = location.pathname;
  const teamMatch = path.match(/^\/team\/([^/]+)/);
  const currentTeamSlug = teamMatch ? decodeURIComponent(teamMatch[1]) : null;
  const currentPage = teamMatch ? path.split("/")[3] || "overview" : null;

  const modeUrl = (url) =>
    adminMode
      ? url + (url.includes("?") ? "&" : "?") + "mode=admin"
      : url;
  const pageId = (page) =>
    ({ overview: "overview", people: "people", events: "eventsLink", categories: "categories" }[
      page
    ] || null);

  function ensureNavigationAssets() {
    if (!document.querySelector('link[data-pandanav-css]')) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "/navigation.css";
      stylesheet.dataset.pandanavCss = "true";
      document.head.appendChild(stylesheet);
    }
  }

  function ensureMobileControls() {
    let openButton = document.querySelector(".sidebar-open");
    if (!openButton) {
      openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "sidebar-open";
      openButton.setAttribute("aria-label", t("openMenu"));
      openButton.setAttribute("aria-controls", "main-navigation");
      openButton.setAttribute("aria-expanded", "false");
      openButton.textContent = "☰";
      document.body.appendChild(openButton);
    }

    let backdrop = document.querySelector(".sidebar-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "sidebar-backdrop";
      backdrop.setAttribute("aria-label", t("close"));
      document.body.appendChild(backdrop);
    }
    backdrop.hidden = true;
    return { openButton, backdrop };
  }

  function link(href, label, id, current = false, adminOnly = false) {
    const a = document.createElement("a");
    a.href = modeUrl(href);
    a.textContent = label;
    a.className = "sidebar-link";
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

    ensureNavigationAssets();
    const { openButton, backdrop } = ensureMobileControls();

    nav.id = "main-navigation";
    nav.className = "nav sidebar";
    document.body.classList.add("has-sidebar");
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
    close.setAttribute("aria-label", t("close"));
    close.textContent = "×";
    header.appendChild(close);
    nav.appendChild(header);

    const menu = document.createElement("nav");
    menu.className = "sidebar-menu";
    menu.setAttribute("aria-label", t("mainNavigation"));

    const teamsLink = link("/teams.html", t("teams"), null, !currentTeamSlug && path === "/teams.html");
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
        toggle.setAttribute("aria-label", team.name);
        toggle.textContent = isCurrent ? "▾" : "▸";
        row.appendChild(toggle);

        const teamLink = link(`/team/${encodeURIComponent(team.slug)}/overview`, team.name, null, isCurrent && currentPage === "overview");
        teamLink.classList.add("sidebar-team-link");
        row.appendChild(teamLink);
        item.appendChild(row);

        const children = document.createElement("div");
        children.className = "sidebar-team-children";
        [["overview", t("overview"), false], ["people", t("peopleNav") || t("people"), true], ["events", t("events"), true], ["categories", t("categories"), true]].forEach(([page, label, adminOnly]) => {
          const child = link(`/team/${encodeURIComponent(team.slug)}/${page}`, label, isCurrent ? pageId(page) : null, isCurrent && currentPage === page, adminOnly);
          child.addEventListener("click", closeMobile);
          children.appendChild(child);
        });
        item.appendChild(children);

        toggle.addEventListener("click", () => {
          const open = item.classList.toggle("open");
          toggle.textContent = open ? "▾" : "▸";
          toggle.setAttribute("aria-expanded", String(open));
        });
        teamLink.addEventListener("click", closeMobile);
        teamList.appendChild(item);
      });

    menu.appendChild(teamList);
    const about = link("/about.html", t("about"), null, path === "/about.html");
    about.classList.add("sidebar-section-link");
    about.addEventListener("click", closeMobile);
    menu.appendChild(about);
    nav.appendChild(menu);

    function closeMobile() {
      nav.classList.remove("mobile-open");
      backdrop.hidden = true;
      openButton.setAttribute("aria-expanded", "false");
    }
    function openMobile() {
      nav.classList.add("mobile-open");
      backdrop.hidden = false;
      openButton.setAttribute("aria-expanded", "true");
    }
    close.onclick = closeMobile;
    openButton.onclick = openMobile;
    backdrop.onclick = closeMobile;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobile();
    });
  }

  async function init() {
    ensureNavigationAssets();
    try {
      const teams = typeof api === "function"
        ? await api("/api/teams")
        : await (await fetch("/api/teams")).json();
      render(teams);
    } catch (error) {
      console.error("Could not load navigation teams:", error);
      render([]);
    }
  }

  init();
})();
