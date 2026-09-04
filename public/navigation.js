(() => {
  const path = location.pathname;
  const teamMatch = path.match(/^\/team\/([^/]+)/);
  const currentTeamSlug = teamMatch ? decodeURIComponent(teamMatch[1]) : null;
  const currentPage = teamMatch ? path.split("/")[3] || "overview" : null;
  let adminMode = false;
  let auth = null;

  const pageId = (page) => ({ overview: "overviewLink", people: "peopleLink", events: "eventsLink", categories: "categoriesLink" })[page] || null;

  function ensureNavigationAssets() {
    if (!document.querySelector("link[data-pandanav-css]")) {
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
    a.href = href;
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
    brand.href = "/teams.html";
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
    (teams || []).slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((team) => {
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
        children.appendChild(link(`/team/${encodeURIComponent(team.slug)}/${page}`, label, isCurrent ? pageId(page) : null, isCurrent && currentPage === page, adminOnly));
      });
      item.appendChild(children);
      toggle.onclick = () => {
        const open = item.classList.toggle("open");
        toggle.textContent = open ? "▾" : "▸";
        toggle.setAttribute("aria-expanded", String(open));
      };
      teamLink.onclick = closeMobile;
      children.querySelectorAll("a").forEach((child) => (child.onclick = closeMobile));
      teamList.appendChild(item);
    });
    menu.appendChild(teamList);
    const about = link("/about.html", t("about"), null, path === "/about.html");
    about.classList.add("sidebar-section-link");
    about.onclick = closeMobile;
    menu.appendChild(about);

    const account = document.createElement("div");
    account.className = "sidebar-account";
    if (auth?.user?.name) {
      const identity = document.createElement("a");
      identity.className = "sidebar-account-user";
      identity.href = "/oidc";
      identity.textContent = auth.user.name;
      identity.title = auth.user.name;
      identity.onclick = closeMobile;
      account.appendChild(identity);
    }
    if (auth?.account?.isSiteAdmin) {
      const admin = link("/oidc/admin", t("admin"), null, path === "/oidc/admin", true);
      admin.classList.add("sidebar-account-admin");
      admin.onclick = closeMobile;
      account.appendChild(admin);
    }
    const logout = document.createElement("a");
    logout.href = "/oidc/logout";
    logout.className = "sidebar-link sidebar-logout";
    logout.textContent = t("oidcLogout");
    logout.onclick = closeMobile;
    account.appendChild(logout);
    menu.appendChild(account);
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
    openButton.onclick = () => (nav.classList.contains("mobile-open") ? closeMobile() : openMobile());
    backdrop.onclick = closeMobile;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobile();
    });
  }

  async function init() {
    ensureNavigationAssets();
    window.pandaplanAuthReady = (async () => {
      try {
        const sessionResponse = await fetch("/oidc/session", { credentials: "same-origin" });
        auth = sessionResponse.ok ? await sessionResponse.json() : { authenticated: false };
        window.pandaplanAuth = auth;
        adminMode = Boolean(auth.authenticated && auth.account?.isSiteAdmin);
        return auth;
      } catch (error) {
        console.error("Could not load authentication state:", error);
        auth = { authenticated: false };
        window.pandaplanAuth = auth;
        adminMode = false;
        return auth;
      }
    })();

    try {
      await window.pandaplanAuthReady;
      if (!auth.authenticated) return;
      const teams = typeof api === "function" ? await api("/api/teams") : await (await fetch("/api/teams")).json();
      render(teams);
    } catch (error) {
      console.error("Could not load navigation:", error);
      render([]);
    }
  }

  init();
})();
