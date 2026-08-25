(() => {
  const adminMode = new URLSearchParams(location.search).get("mode") === "admin";
  const path = location.pathname;
  const teamMatch = path.match(/^\/team\/([^/]+)/);
  const currentTeamSlug = teamMatch ? decodeURIComponent(teamMatch[1]) : null;
  const currentPage = teamMatch ? path.split("/")[3] || "overview" : null;
  const modeUrl = (url) => adminMode ? url + (url.includes("?") ? "&" : "?") + "mode=admin" : url;
  const pageId = (page) => ({ overview: "overview", people: "people", events: "eventsLink", categories: "categories" }[page] || null);

  function installSidebarStyles() {
    if (document.getElementById("sidebar-navigation-styles")) return;
    const style = document.createElement("style");
    style.id = "sidebar-navigation-styles";
    style.textContent = `
      .nav.sidebar{position:fixed;inset:0 auto 0 0;z-index:1000;width:250px;height:100vh;display:flex;flex-direction:column;padding:0;overflow-y:auto;background:var(--paper);border-right:1px solid var(--line)}
      .sidebar-header{display:flex;align-items:center;justify-content:space-between;padding:18px 16px;border-bottom:1px solid var(--line)}
      .sidebar .brand{display:flex;align-items:center;gap:8px;color:var(--ink);font-family:"Poppins",sans-serif;font-size:19px;font-weight:700;text-decoration:none}
      .sidebar-close{display:none;border:0;background:transparent;color:var(--ink-soft);cursor:pointer;font-size:28px;line-height:1}
      .sidebar-menu{display:flex;flex-direction:column;padding:12px 10px 24px}.sidebar-link{display:block;padding:8px 10px;border-radius:var(--radius);color:var(--ink-soft);font-size:13px;font-weight:600;text-decoration:none}.sidebar-link:hover{color:var(--ink);background:var(--paper-dim)}.sidebar-link.current{background:var(--accent-bg);color:var(--accent)}.sidebar-section-link{margin:2px 0 8px;color:var(--ink);font-size:14px;font-weight:700}.sidebar-team-list{display:flex;flex-direction:column;gap:2px}.sidebar-team-row{display:flex;align-items:center;gap:2px}.sidebar-team-toggle{flex:0 0 28px;width:28px;height:34px;padding:0;border:0;border-radius:var(--radius);background:transparent;color:var(--ink-soft);cursor:pointer}.sidebar-team-toggle:hover{background:var(--paper-dim);color:var(--ink)}.sidebar-team-link{flex:1;min-width:0;color:var(--ink)}.sidebar-team.current-team>.sidebar-team-row .sidebar-team-link{font-weight:700}.sidebar-team-children{display:none;margin:0 0 5px 30px;padding-left:8px;border-left:1px solid var(--line)}.sidebar-team.open>.sidebar-team-children{display:block}.sidebar-team-children .sidebar-link{font-size:12.5px;font-weight:500}
      .sidebar-open{display:none;position:fixed;top:12px;left:12px;z-index:1100;width:42px;height:42px;border:1px solid var(--line);border-radius:var(--radius);background:var(--paper);color:var(--ink);box-shadow:0 2px 8px rgba(0,0,0,.12);cursor:pointer;font-size:22px}.sidebar-backdrop{display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.35)}body:has(.nav.sidebar) .wrap{margin-left:250px;max-width:none}body:has(.nav.sidebar) .wrap>*{max-width:1000px}
      @media(max-width:640px){.nav.sidebar{width:min(82vw,300px);transform:translateX(-105%);transition:transform .2s ease;box-shadow:4px 0 18px rgba(0,0,0,.12)}.nav.sidebar.mobile-open{transform:translateX(0)}.sidebar-close,.sidebar-open{display:block}.sidebar-open{top:12px}.sidebar-backdrop{display:block}.sidebar-backdrop[hidden]{display:none}body:has(.nav.sidebar) .wrap{margin-left:0;padding-top:68px}body.sidebar-mobile-open{overflow:hidden}}
    `;
    document.head.appendChild(style);
  }

  function link(href,label,id,current=false,adminOnly=false){const a=document.createElement("a");a.href=modeUrl(href);a.textContent=label;a.className="sidebar-link";if(id)a.id=id;if(current)a.classList.add("current");if(adminOnly){a.dataset.adminOnly="true";a.hidden=!adminMode}return a}

  function ensureMobileControls(nav){
    let openButton=document.querySelector(".sidebar-open");
    if(!openButton){openButton=document.createElement("button");openButton.type="button";openButton.className="sidebar-open";openButton.setAttribute("aria-label",t("openMenu")||"Open menu");openButton.setAttribute("aria-controls","appSidebar");openButton.setAttribute("aria-expanded","false");openButton.textContent="☰";document.body.prepend(openButton)}
    let backdrop=document.querySelector(".sidebar-backdrop");
    if(!backdrop){backdrop=document.createElement("div");backdrop.className="sidebar-backdrop";backdrop.hidden=true;document.body.appendChild(backdrop)}
    nav.id="appSidebar";return{openButton,backdrop}
  }

  function render(teams){
    const nav=document.querySelector(".nav");if(!nav)return;installSidebarStyles();
    const {openButton,backdrop}=ensureMobileControls(nav);nav.className="sidebar";nav.innerHTML="";
    const header=document.createElement("div");header.className="sidebar-header";
    const brand=document.createElement("a");brand.className="brand";brand.id="brand";brand.href=modeUrl("/teams.html");brand.textContent="🐼 pandaplan";header.appendChild(brand);
    const close=document.createElement("button");close.type="button";close.className="sidebar-close";close.setAttribute("aria-label",t("close")||"Close");close.textContent="×";header.appendChild(close);nav.appendChild(header);
    const menu=document.createElement("nav");menu.className="sidebar-menu";menu.setAttribute("aria-label",t("mainNavigation")||"Main navigation");
    const teamsLink=link("/teams.html",t("teams"),null,!currentTeamSlug&&path==="/teams.html");teamsLink.classList.add("sidebar-section-link");menu.appendChild(teamsLink);
    const teamList=document.createElement("div");teamList.className="sidebar-team-list";
    (teams||[]).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(team=>{
      const item=document.createElement("div");item.className="sidebar-team";const isCurrent=team.slug===currentTeamSlug;if(isCurrent)item.classList.add("current-team","open");
      const row=document.createElement("div");row.className="sidebar-team-row";const toggle=document.createElement("button");toggle.type="button";toggle.className="sidebar-team-toggle";toggle.setAttribute("aria-expanded",String(isCurrent));toggle.setAttribute("aria-label",team.name);toggle.textContent=isCurrent?"▾":"▸";row.appendChild(toggle);
      const teamLink=link(`/team/${encodeURIComponent(team.slug)}/overview`,team.name,null,isCurrent&&currentPage==="overview");teamLink.classList.add("sidebar-team-link");row.appendChild(teamLink);item.appendChild(row);
      const children=document.createElement("div");children.className="sidebar-team-children";[["overview",t("overview"),false],["people",t("peopleNav")||t("people"),true],["events",t("events"),true],["categories",t("categories"),true]].forEach(([page,label,adminOnly])=>children.appendChild(link(`/team/${encodeURIComponent(team.slug)}/${page}`,label,isCurrent?pageId(page):null,isCurrent&&currentPage===page,adminOnly)));item.appendChild(children);
      toggle.addEventListener("click",()=>{const open=item.classList.toggle("open");toggle.textContent=open?"▾":"▸";toggle.setAttribute("aria-expanded",String(open))});teamList.appendChild(item)
    });
    menu.appendChild(teamList);const about=link("/about.html",t("about"),null,path==="/about.html");about.classList.add("sidebar-section-link");menu.appendChild(about);nav.appendChild(menu);
    const setMobileOpen=open=>{nav.classList.toggle("mobile-open",open);backdrop.hidden=!open;openButton.setAttribute("aria-expanded",String(open));document.body.classList.toggle("sidebar-mobile-open",open)};
    close.onclick=()=>setMobileOpen(false);openButton.onclick=()=>setMobileOpen(true);backdrop.onclick=()=>setMobileOpen(false);nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setMobileOpen(false)));
  }

  async function init(){try{render(await api("/api/teams"))}catch(error){console.error("Could not load navigation teams:",error);render([])}}init();
})();
