function renderCategories(pageState) {
  const list = document.getElementById("list");
  list.innerHTML = pageState.categories
    .map(
      (c) =>
        `<div class="person-admin-item"><div class="person-head"><strong>${escapeHtml(c.name)}</strong><button class="del" type="button" data-action="remove" data-id="${escapeHtml(c.id)}">${escapeHtml(t("remove"))}</button></div><div class="chip-row">${STAFF_ROLES.map((r) => `<button type="button" class="chip ${(c.requiredStaffRoles || []).includes(r.id) ? "active" : ""}" data-action="role" data-id="${escapeHtml(c.id)}" data-role="${escapeHtml(r.id)}">${escapeHtml(r.label)}</button>`).join("")}</div></div>`,
    )
    .join("");
}
