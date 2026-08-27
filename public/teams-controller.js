const teamsPageState = {
  teams: [],
  persons: [],
  details: {},
  adminMode: new URLSearchParams(location.search).get("mode") === "admin",
};
function applyTeamsTranslations() {
  document.documentElement.lang = currentLanguage === "nl-BE" ? "nl" : "en";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
}
async function loadTeams() {
  teamsPageState.teams = await teamsApi.list();
  teamsPageState.persons = teamsPageState.adminMode
    ? await teamsApi.persons()
    : [];
  if (teamsPageState.adminMode) {
    const entries = await Promise.all(
      teamsPageState.teams.map(async (team) => [
        team.slug,
        await teamsApi.detail(team.slug),
      ]),
    );
    teamsPageState.details = Object.fromEntries(entries);
  }
  applyTeamsTranslations();
  renderTeams(teamsPageState);
}
function handleTeamsClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action,
    slug = target.dataset.slug;
  if (action === "add-member") {
    if (!target.value) return;
    teamsApi
      .addMember(slug, target.value)
      .then(loadTeams)
      .catch((e) => alert(e.message));
    target.value = "";
  } else if (action === "remove-member") {
    if (!confirm(t("confirmRemovePersonFromTeam"))) return;
    teamsApi
      .removeMember(slug, target.dataset.person)
      .then(loadTeams)
      .catch((e) => alert(e.message));
  } else if (action === "save") {
    const card = target.closest("[data-team-slug]");
    teamsApi
      .update(slug, {
        name: card.querySelector(".edit-name").value,
        newSlug: card.querySelector(".edit-slug").value,
        description: card.querySelector(".edit-description").value,
      })
      .then(loadTeams)
      .catch((e) => alert(e.message || t("teamSaveFailed")));
  } else if (action === "delete") {
    if (!confirm(t("deleteTeamConfirm"))) return;
    teamsApi
      .remove(slug)
      .then(loadTeams)
      .catch((e) => alert(e.message || t("teamDeleteFailed")));
  } else if (action === "remove-attendance") {
    if (!confirm(t("removeAllAttendanceConfirm"))) return;
    teamsApi
      .removeAttendance(slug)
      .then(() => alert(t("attendanceRemoved")))
      .catch((e) => alert(e.message || t("teamDataActionFailed")));
  } else if (action === "remove-events") {
    if (!confirm(t("removeAllEventsConfirm"))) return;
    teamsApi
      .removeEvents(slug)
      .then(loadTeams)
      .catch((e) => alert(e.message || t("teamDataActionFailed")));
  }
}
async function createTeam() {
  const note = document.getElementById("note"),
    name = document.getElementById("name").value.trim(),
    slug = document.getElementById("slug").value.trim(),
    description = document.getElementById("description").value;
  try {
    await teamsApi.create({ name, slug, description });
    document.getElementById("name").value = "";
    document.getElementById("slug").value = "";
    document.getElementById("description").value = "";
    document.getElementById("slug").dataset.edited = "";
    note.textContent = t("created");
    await loadTeams();
  } catch (e) {
    note.textContent = e.message || t("teamCreateFailed");
  }
}
if (teamsPageState.adminMode)
  document.getElementById("create-team-card").hidden = false;
document.getElementById("teams").onclick = handleTeamsClick;
document.getElementById("teams").onchange = handleTeamsClick;
document.getElementById("create").onclick = createTeam;
document.getElementById("name").oninput = (e) => {
  const slug = document.getElementById("slug");
  if (!slug.dataset.edited)
    slug.value = e.target.value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
      .slice(0, 100);
};
document.getElementById("slug").oninput = (e) => {
  e.target.dataset.edited = "1";
};
applyTeamsTranslations();
loadTeams().catch((e) => {
  document.getElementById("teams").innerHTML =
    `<div class="card">${escapeHtml(e.message)}</div>`;
});
