const slug = decodeURIComponent(location.pathname.split("/")[2] || "");
function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function defaultSeasonEndDate() {
  const d = new Date();
  const year = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
  return `${year}-06-30`;
}
const pageState = {
  state: null,
  dateFrom: todayDateString(),
  dateTo: defaultSeasonEndDate(),
  categoryIds: new Set(),
  editMode: false,
  staffEditMode: false,
  adminMode: new URLSearchParams(location.search).get("mode") === "admin",
};
function modeUrl(url) {
  return pageState.adminMode
    ? url + (url.includes("?") ? "&" : "?") + "mode=admin"
    : url;
}
function base() {
  return "/team/" + encodeURIComponent(slug);
}
function nav() {
  const b = base();
  document.getElementById("brand").href = modeUrl(b + "/overview");
  document.getElementById("overview").href = modeUrl(b + "/overview");
  document.getElementById("eventsLink").href = modeUrl(b + "/events");
  document.getElementById("people").href = modeUrl(b + "/people");
  document.getElementById("categories").href = modeUrl(b + "/categories");
  document
    .querySelectorAll("[data-admin-only]")
    .forEach((el) => (el.hidden = !pageState.adminMode));
}
function applyTranslations() {
  document.documentElement.lang = currentLanguage === "nl-BE" ? "nl" : "en";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
}
function updatePersonCalendar() {
  const personCalendar = document.getElementById("personCalendar");
  const urlField = document.getElementById("personCalendarUrl");
  const copy = document.getElementById("copyPersonCalendar");
  const id = personCalendar.value;
  if (!id) {
    urlField.value = "";
    copy.disabled = true;
    return;
  }
  const url =
    location.origin + "/calendar/person/" + encodeURIComponent(id) + ".ics";
  urlField.value = url;
  copy.disabled = false;
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      copy.textContent = t("copied");
    } catch (e) {
      urlField.select();
      document.execCommand("copy");
      copy.textContent = t("selectAndCopy");
    }
    setTimeout(() => (copy.textContent = t("copy")), 1500);
  };
}
function updateEditButtons() {
  document.getElementById("editAttendance").textContent = pageState.editMode
    ? t("doneAttendance")
    : t("editAttendance");
  document.getElementById("editStaff").textContent = pageState.staffEditMode
    ? t("doneStaff")
    : t("editStaff");
}
function render() {
  renderCategoryFilterChips(
    document.getElementById("categoriesFilter"),
    pageState.state.categories,
    pageState.categoryIds,
    render,
  );
  renderTeamOverview();
  updateEditButtons();
  // Bulk attendance is a separate renderer, but it depends on the same
  // date/category filter state. Refresh it whenever the Overview renders so
  // its count changes immediately when a filter changes.
  if (typeof window.refreshBulkAttendance === "function") {
    window.refreshBulkAttendance();
  }
}
function handleOverviewClick(event) {
  const target = event.target.closest("button, .staff-person");
  if (!target) return;
  if (target.matches(".attendance-person"))
    toggleAttendance(target.dataset.person, target.dataset.event);
  else if (target.matches(".note-button"))
    openNoteEditor(target.dataset.notePerson, target.dataset.noteEvent);
  else if (target.matches(".note-save")) saveNote(target);
  else if (target.matches(".note-cancel")) closeNoteEditor(target);
  else if (target.matches(".staff-person"))
    toggleStaffAssignment(
      target.dataset.staffPerson,
      target.dataset.staffEvent,
      target.dataset.staffRole,
    );
}
function bindEventHandlers() {
  document.getElementById("events").onclick = handleOverviewClick;
  document.getElementById("editAttendance").onclick = () => {
    pageState.editMode = !pageState.editMode;
    if (pageState.editMode) pageState.staffEditMode = false;
    render();
  };
  document.getElementById("editStaff").onclick = () => {
    pageState.staffEditMode = !pageState.staffEditMode;
    if (pageState.staffEditMode) pageState.editMode = false;
    render();
  };
}
function bindFilters() {
  const from = document.getElementById("dateFrom");
  const to = document.getElementById("dateTo");
  from.value = pageState.dateFrom;
  to.value = pageState.dateTo;
  const updateDates = () => {
    if (from.value && to.value && from.value > to.value) {
      from.setCustomValidity(t("invalidDateRange"));
      return;
    }
    from.setCustomValidity("");
    pageState.dateFrom = from.value;
    pageState.dateTo = to.value;
    render();
  };
  from.onchange = updateDates;
  to.onchange = updateDates;
}
async function load() {
  nav();
  applyTranslations();
  pageState.state = await getTeamState(slug);
  document.getElementById("title").textContent =
    pageState.state.team.name + " · " + t("overview");
  const calendarToggle = document.getElementById("calendarToggle");
  const calendarContent = document.getElementById("calendarContent");
  const calendarUrl = document.getElementById("calendarUrl");
  const copyCalendar = document.getElementById("copyCalendar");
  const personCalendar = document.getElementById("personCalendar");
  const url =
    location.origin +
    "/calendar/team/" +
    encodeURIComponent(slug) +
    ".ics";
  calendarUrl.value = url;
  copyCalendar.onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyCalendar.textContent = t("copied");
    } catch (e) {
      calendarUrl.select();
      document.execCommand("copy");
      copyCalendar.textContent = t("selectAndCopy");
    }
    setTimeout(() => (copyCalendar.textContent = t("copy")), 1500);
  };
  [...pageState.state.persons]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name;
      personCalendar.appendChild(o);
    });
  personCalendar.onchange = updatePersonCalendar;
  updatePersonCalendar();
  const toggleCalendar = () => {
    const expanded = calendarContent.hidden;
    calendarContent.hidden = !expanded;
    calendarToggle.setAttribute("aria-expanded", String(expanded));
    calendarToggle.querySelector(".calendar-chevron").textContent = expanded
      ? "▾"
      : "▸";
    calendarToggle.querySelector(".calendar-expand-hint").lastChild.textContent =
      expanded ? " " + t("clickToCollapse") : " " + t("clickToExpand");
  };
  calendarToggle.onclick = toggleCalendar;
  calendarToggle.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCalendar();
    }
  };
  bindEventHandlers();
  bindFilters();
  render();
}
async function toggleAttendance(personId, eventId) {
  const current =
    pageState.state.attendance[personId]?.[eventId]?.status || "unknown";
  const next =
    current === "yes" ? "maybe" : current === "maybe" ? "no" : "yes";
  try {
    await updateAttendance(
      slug,
      personId,
      eventId,
      next,
      pageState.state.attendance[personId]?.[eventId]?.note || "",
    );
    if (!pageState.state.attendance[personId])
      pageState.state.attendance[personId] = {};
    pageState.state.attendance[personId][eventId] = {
      status: next,
      note: pageState.state.attendance[personId]?.[eventId]?.note || "",
    };
    render();
  } catch (error) {
    console.error("Could not update attendance:", error);
    alert(t("couldNotUpdateAttendance"));
  }
}
function openNoteEditor(personId, eventId) {
  const editor = document.querySelector(
    '[data-editor-person="' +
      CSS.escape(personId) +
      '"][data-editor-event="' +
      CSS.escape(eventId) +
      '"]',
  );
  if (!editor) return;
  editor.hidden = false;
  const input = editor.querySelector("input");
  input.focus();
  input.select();
}
async function saveNote(button) {
  const editor = button.closest(".note-editor");
  const personId = editor.dataset.editorPerson;
  const eventId = editor.dataset.editorEvent;
  const note = editor.querySelector("input").value;
  const current = pageState.state.attendance[personId]?.[eventId] || {
    status: "unknown",
    note: "",
  };
  try {
    await updateAttendance(slug, personId, eventId, current.status, note);
    if (!pageState.state.attendance[personId])
      pageState.state.attendance[personId] = {};
    pageState.state.attendance[personId][eventId] = {
      status: current.status,
      note,
    };
    render();
  } catch (error) {
    console.error("Could not save note:", error);
    alert(t("couldNotSaveNote"));
  }
}
function closeNoteEditor(button) {
  button.closest(".note-editor").hidden = true;
}
function statusLabel(status) {
  return status === "yes"
    ? t("goingShort")
    : status === "maybe"
      ? t("maybe")
      : status === "no"
        ? t("notGoingShort")
        : t("unknownShort");
}
function roster(label, people, cls) {
  return (
    '<div class="attendance-group ' +
    cls +
    '"><strong>' +
    label +
    " (" +
    people.length +
    ")</strong>" +
    (people.length
      ? '<div class="roster-names">' +
        people
          .map(
            (p) =>
              '<span class="roster-name">' +
              escapeHtml(p.name) +
              (p.note
                ? ' <span class="roster-note">· ' +
                  escapeHtml(p.note) +
                  "</span>"
                : "") +
              "</span>",
          )
          .join("") +
        "</div>"
      : "") +
    "</div>"
  );
}
load();
