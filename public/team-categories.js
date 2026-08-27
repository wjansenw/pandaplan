const categoriesPageState = {
  slug: getTeamSlug(),
  team: null,
  categories: [],
  adminMode: isTeamAdminMode(),
};
function applyCategoryTranslations() {
  document.documentElement.lang = currentLanguage === "nl-BE" ? "nl" : "en";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
}
async function loadCategories() {
  const data = await categoriesApi.load(categoriesPageState.slug);
  categoriesPageState.team = data.team;
  categoriesPageState.categories = data.categories;
  setTeamNavigation(categoriesPageState.slug, categoriesPageState.adminMode);
  applyCategoryTranslations();
  document.getElementById("title").textContent =
    data.team.name + " · " + t("categories");
  renderCategories(categoriesPageState);
}
async function handleCategoryClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  const id = target.dataset.id;
  if (target.dataset.action === "remove") {
    if (!confirm(t("confirmRemoveCategory"))) return;
    try {
      await categoriesApi.remove(categoriesPageState.slug, id);
      await loadCategories();
    } catch (e) {
      document.getElementById("note").textContent = e.message;
    }
  } else if (target.dataset.action === "role") {
    const c = categoriesPageState.categories.find((x) => x.id === id);
    if (!c) return;
    const roles = new Set(c.requiredStaffRoles || []);
    roles.has(target.dataset.role)
      ? roles.delete(target.dataset.role)
      : roles.add(target.dataset.role);
    try {
      const result = await categoriesApi.update(categoriesPageState.slug, id, {
        name: c.name,
        color: c.color,
        requiredStaffRoles: [...roles],
      });
      categoriesPageState.categories = result;
      renderCategories(categoriesPageState);
    } catch (e) {
      document.getElementById("note").textContent = e.message;
    }
  }
}
async function addCategory() {
  const input = document.getElementById("name"),
    note = document.getElementById("note"),
    name = input.value.trim();
  if (!name) {
    note.textContent = t("nameRequired");
    input.focus();
    return;
  }
  try {
    await categoriesApi.add(categoriesPageState.slug, name);
    input.value = "";
    note.textContent = t("added");
    await loadCategories();
  } catch (e) {
    note.textContent = e.message;
  }
}
document.getElementById("list").onclick = handleCategoryClick;
document.getElementById("add").onclick = addCategory;
document.getElementById("name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addCategory();
});
loadCategories().catch((e) => {
  document.getElementById("note").textContent = e.message;
});
