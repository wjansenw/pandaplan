const peoplePageState = {
  slug: getTeamSlug(),
  team: null,
  selectedRoles: new Set(["participant"]),
  adminMode: isTeamAdminMode(),
};
function applyPageTranslations() {
  document.documentElement.lang = currentLanguage === "nl-BE" ? "nl" : "en";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
}
function loadPeople() {
  return peopleApi.load(peoplePageState.slug).then((team) => {
    peoplePageState.team = team;
    setTeamNavigation(peoplePageState.slug, peoplePageState.adminMode);
    applyPageTranslations();
    document.getElementById("title").textContent =
      team.name + " · " + t("peopleNav");
    renderPeople(peoplePageState);
    renderSelectedRoles(peoplePageState.selectedRoles);
  });
}
function handlePeopleClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "new-role") {
    const role = target.dataset.role;
    peoplePageState.selectedRoles.has(role)
      ? peoplePageState.selectedRoles.delete(role)
      : peoplePageState.selectedRoles.add(role);
    renderSelectedRoles(peoplePageState.selectedRoles);
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
document.getElementById("list").onclick = handlePeopleClick;
document.getElementById("roles").onclick = handlePeopleClick;
document.getElementById("add").onclick = addPerson;
loadPeople().catch((e) => {
  document.getElementById("note").textContent = e.message;
});
