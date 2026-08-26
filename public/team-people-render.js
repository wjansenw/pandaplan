function renderPeople(pageState) {
  const list = document.getElementById("list");
  list.innerHTML = (pageState.team.members || []).map((p) => `
    <div class="person-admin-item">
      <div class="person-head"><strong>${escapeHtml(p.name)}</strong><button class="del" data-action="remove" data-person="${escapeHtml(p.id)}">${escapeHtml(t("remove"))}</button></div>
      <div class="chip-row" data-person-roles="${escapeHtml(p.id)}">
        ${ALL_ROLES.map((r) => `<button type="button" class="chip ${p.roles.includes(r.id) ? "active" : ""}" data-action="role" data-person="${escapeHtml(p.id)}" data-role="${escapeHtml(r.id)}">${escapeHtml(r.label)}</button>`).join("")}
      </div>
    </div>`).join("");
}
function renderSelectedRoles(selected) {
  const box = document.getElementById("roles");
  box.innerHTML = ALL_ROLES.map((r) => `<button type="button" class="chip ${selected.has(r.id) ? "active" : ""}" data-action="new-role" data-role="${escapeHtml(r.id)}">${escapeHtml(r.label)}</button>`).join("");
}
