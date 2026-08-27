function renderTeams(state) {
  const box = document.getElementById("teams");
  box.innerHTML = state.teams.length
    ? state.teams.map((team) => renderTeamCard(team, state)).join("")
    : `<div class="card"><p>${escapeHtml(t("noTeams"))}</p></div>`;
}
function renderTeamCard(team, state) {
  const open = teamModeUrl(
    "/team/" + encodeURIComponent(team.slug),
    state.adminMode,
  );
  if (!state.adminMode)
    return `<div class="card"><div class="card-head"><div><h2>${escapeHtml(team.name)}</h2></div><a class="btn secondary" href="${open}">${escapeHtml(t("openTeam"))}</a></div></div>`;
  const detail = state.details[team.slug];
  const members = detail
    ? (detail.members || [])
        .map(
          (m) =>
            `<div class="person-admin-item"><strong>${escapeHtml(m.name)}</strong><div>${m.roles.map((r) => escapeHtml(roleLabel(r))).join(", ")}</div><button class="del" data-action="remove-member" data-slug="${escapeHtml(team.slug)}" data-person="${escapeHtml(m.id)}">${escapeHtml(t("remove"))}</button></div>`,
        )
        .join("")
    : "";
  return `<div class="card" data-team-slug="${escapeHtml(team.slug)}"><div class="card-head"><div><h2>${escapeHtml(team.name)}</h2><div class="sub">/team/${escapeHtml(team.slug)}/ · ${escapeHtml(t("memberCount", { count: team.memberCount }))}</div></div><a class="btn secondary" href="${open}">${escapeHtml(t("openTeam"))}</a></div><div class="field"><label>${escapeHtml(t("name"))}</label><input class="edit-name" value="${escapeHtml(team.name)}" maxlength="200"></div><div class="field"><label>${escapeHtml(t("slug"))}</label><input class="edit-slug" value="${escapeHtml(team.slug)}" maxlength="100"></div><div class="field"><label>${escapeHtml(t("description"))}</label><textarea class="edit-description" maxlength="500">${escapeHtml(team.description || "")}</textarea></div><div class="btn-row"><button class="btn" data-action="save" data-slug="${escapeHtml(team.slug)}">${escapeHtml(t("saveTeam"))}</button><button class="btn secondary" data-action="delete" data-slug="${escapeHtml(team.slug)}">${escapeHtml(t("deleteTeam"))}</button></div><div class="field"><label>${escapeHtml(t("addExistingPerson"))}</label><select class="add-person" data-action="add-member" data-slug="${escapeHtml(team.slug)}"><option value="">${escapeHtml(t("selectPerson"))}</option>${state.persons.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")}</select></div><div class="member-list">${members}</div><div class="card" style="margin-top:1rem"><h3>${escapeHtml(t("admin"))}</h3><div class="btn-row"><button class="btn secondary" data-action="remove-attendance" data-slug="${escapeHtml(team.slug)}">${escapeHtml(t("removeAllAttendance"))}</button><button class="btn secondary" data-action="remove-events" data-slug="${escapeHtml(team.slug)}">${escapeHtml(t("removeAllEvents"))}</button></div></div></div>`;
}
