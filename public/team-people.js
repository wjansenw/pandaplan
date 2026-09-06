const peoplePageState = {
  slug: getTeamSlug(),
  team: null,
  available: [],
  selectedRoles: new Set(["participant"]),
  selectedExistingRoles: new Set(["participant"]),
  adminMode: false,
};
function applyPageTranslations() {
  document.documentElement.lang = currentLanguage === "nl-BE" ? "nl" : "en";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
}
async function loadPeople() {
  if (window.pandaplanAuthReady) await window.pandaplanAuthReady;
  peoplePageState.adminMode = isTeamAdminMode();
  const [team, available] = await Promise.all([
    peopleApi.load(peoplePageState.slug),
    peopleApi.available(peoplePageState.slug),
  ]);
  peoplePageState.team = team;
  peoplePageState.available = available;
  setTeamNavigation(peoplePageState.slug, peoplePageState.adminMode);
  applyPageTranslations();
  document.getElementById("title").textContent =
    team.name + " · " + t("peopleNav");
  renderPeople(peoplePageState);
  renderSelectedRoles(peoplePageState.selectedRoles);
  renderExistingPeople(peoplePageState);
  renderSelectedExistingRoles(peoplePageState.selectedExistingRoles);
}
function handlePeopleClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "new-role" || action === "existing-role") {
    const selected = action === "new-role"
      ? peoplePageState.selectedRoles
      : peoplePageState.selectedExistingRoles;
    const role = target.dataset.role;
    selected.has(role) ? selected.delete(role) : selected.add(role);
    if (action === "new-role") renderSelectedRoles(selected);
    else renderSelectedExistingRoles(selected);
    return;
  }
  if (action === "role") {
    const person = peoplePageState.team.members.find(
      (p) => p.id === target.dataset.person,
    );
    if (!person) return;
    const roles = new Set(person.roles);
    const role = target.dataset.role;
    roles.has(role) ? roles.delete(role) : roles.add(role);
    if (!roles.size) return alert(t("roleRequired"));
    peopleApi
      .updateRoles(peoplePageState.slug, person.id, [...roles])
      .then(loadPeople)
      .catch((e) => alert(e.message));
  }
  if (action === "remove") {
    if (!confirm(t("confirmRemovePersonFromTeam"))) return;
    peopleApi
      .remove(peoplePageState.slug, target.dataset.person)
      .then(loadPeople)
      .catch((e) => alert(e.message));
  }
}
async function addPerson() {
  const name = document.getElementById("name").value.trim();
  const note = document.getElementById("note");
  if (!name || !peoplePageState.selectedRoles.size) {
    note.textContent = t("nameAndRoleRequired");
    return;
  }
  try {
    await peopleApi.add(peoplePageState.slug, name, [
      ...peoplePageState.selectedRoles,
    ]);
    document.getElementById("name").value = "";
    note.textContent = t("added");
    await loadPeople();
  } catch (e) {
    note.textContent = e.message;
  }
}
async function addExistingPerson() {
  const select = document.getElementById("existing-person");
  const note = document.getElementById("existing-note");
  if (!select.value || !peoplePageState.selectedExistingRoles.size) {
    note.textContent = t("personAndRoleRequired");
    return;
  }
  try {
    await peopleApi.addExisting(peoplePageState.slug, select.value, [
      ...peoplePageState.selectedExistingRoles,
    ]);
    note.textContent = t("added");
    await loadPeople();
  } catch (e) {
    note.textContent = e.message;
  }
}
document.getElementById("list").onclick = handlePeopleClick;
document.getElementById("roles").onclick = handlePeopleClick;
document.getElementById("existing-roles").onclick = handlePeopleClick;
document.getElementById("add").onclick = addPerson;
document.getElementById("add-existing").onclick = addExistingPerson;
loadPeople().catch((e) => {
  document.getElementById("note").textContent = e.message;
});
