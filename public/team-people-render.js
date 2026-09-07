function renderPeople(pageState) {
  const list = document.getElementById("list");
  list.innerHTML = (pageState.team.members || [])
    .map(
      (p) => `
    <div class="person-admin-item">
      <div class="person-head">
        ${pageState.adminMode
          ? `<input class="person-name" data-person="${escapeHtml(p.id)}" value="${escapeHtml(p.name)}" aria-label="${escapeHtml(t("name"))}">
             <button type="button" class="btn" data-action="save-name" data-person="${escapeHtml(p.id)}">${escapeHtml(t("save"))}</button>`
          : `<strong>${escapeHtml(p.name)}</strong>`}
        ${pageState.adminMode ? `<button class="del" data-action="remove" data-person="${escapeHtml(p.id)}">${escapeHtml(t("remove"))}</button>` : ""}
      </div>
      ${pageState.adminMode ? `<div class="chip-row" data-person-roles="${escapeHtml(p.id)}">
        ${ALL_ROLES.map((r) => `<button type="button" class="chip ${p.roles.includes(r.id) ? "active" : ""}" data-action="role" data-person="${escapeHtml(p.id)}" data-role="${escapeHtml(r.id)}">${escapeHtml(r.label)}</button>`).join("")}
      </div>` : ""}
    </div>`,
    )
    .join("");
}
function renderSelectedRoles(selected) {
  const box = document.getElementById("roles");
  box.innerHTML = ALL_ROLES.map(
    (r) =>
      `<button type="button" class="chip ${selected.has(r.id) ? "active" : ""}" data-action="new-role" data-role="${escapeHtml(r.id)}">${escapeHtml(r.label)}</button>`,
  ).join("");
}
function renderExistingPeople(pageState) {
  const select = document.getElementById("existing-person");
  const current = select.value;
  select.innerHTML = `<option value="">${escapeHtml(t("selectPerson"))}</option>` +
    pageState.available
      .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
      .join("");
  if (pageState.available.some((p) => p.id === current)) select.value = current;
}
function renderSelectedExistingRoles(selected) {
  const box = document.getElementById("existing-roles");
  box.innerHTML = ALL_ROLES.map(
    (r) =>
      `<button type="button" class="chip ${selected.has(r.id) ? "active" : ""}" data-action="existing-role" data-role="${escapeHtml(r.id)}">${escapeHtml(r.label)}</button>`,
  ).join("");
}
