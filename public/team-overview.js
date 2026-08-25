const slug = decodeURIComponent(location.pathname.split("/")[2] || "");

const pageState = {
  state: null,
  dateMode: "upcoming",
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
  document.documentElement.lang =
    currentLanguage === "nl-BE" ? "nl" : "en";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
}
function updatePersonCalendar() {
  const personCalendar = document.getElementById("personCalendar");
  const personCalendarUrl = document.getElementById("personCalendarUrl");
  const copyPersonCalendar = document.getElementById("copyPersonCalendar");
  const personId = personCalendar.value;
  if (!personId) {
    personCalendarUrl.value = "";
    copyPersonCalendar.disabled = true;
    return;
  }
  const url =
    location.origin +
    "/calendar/person/" +
    encodeURIComponent(personId) +
    ".ics";
  personCalendarUrl.value = url;
  copyPersonCalendar.disabled = false;
  copyPersonCalendar.onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyPersonCalendar.textContent = t("copied");
    } catch (e) {
      personCalendarUrl.select();
      document.execCommand("copy");
      copyPersonCalendar.textContent = t("selectAndCopy");
    }
    setTimeout(() => (copyPersonCalendar.textContent = t("copy")), 1500);
  };
}
async function load() {
  nav();
  applyTranslations();
  pageState.state = await api(
    "/api/teams/" + encodeURIComponent(slug) + "/state",
  );
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
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      personCalendar.appendChild(option);
    });
  personCalendar.onchange = updatePersonCalendar;
  updatePersonCalendar();
  const toggleCalendar = () => {
    const expanded = calendarContent.hidden;
    calendarContent.hidden = !expanded;
    calendarToggle.setAttribute("aria-expanded", String(expanded));
    calendarToggle.querySelector(".calendar-chevron").textContent =
      expanded ? "▾" : "▸";
    calendarToggle.querySelector(
      ".calendar-expand-hint",
    ).lastChild.textContent = expanded
      ? " " + t("clickToCollapse")
      : " " + t("clickToExpand");
  };
  calendarToggle.onclick = toggleCalendar;
  calendarToggle.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCalendar();
    }
  };
  const editAttendance = document.getElementById("editAttendance");
  const editStaff = document.getElementById("editStaff");
  editAttendance.onclick = () => {
    pageState.editMode = !pageState.editMode;
    if (pageState.editMode) pageState.staffEditMode = false;
    editAttendance.textContent = pageState.editMode
      ? t("doneAttendance")
      : t("editAttendance");
    editStaff.textContent = pageState.staffEditMode
      ? t("doneStaff")
      : t("editStaff");
    render();
  };
  editStaff.onclick = () => {
    pageState.staffEditMode = !pageState.staffEditMode;
    if (pageState.staffEditMode) pageState.editMode = false;
    editStaff.textContent = pageState.staffEditMode
      ? t("doneStaff")
      : t("editStaff");
    editAttendance.textContent = pageState.editMode
      ? t("doneAttendance")
      : t("editAttendance");
    render();
  };
  render();
}
function render() {
  renderDateFilterChips(
    document.getElementById("dates"),
    pageState.dateMode,
    (m) => {
      pageState.dateMode = m;
      render();
    },
  );
  const list = sortByDateTime(
    filterEvents(pageState.state.events, {
      categoryIds: new Set(),
      dateMode: pageState.dateMode,
    }),
  );
  const box = document.getElementById("events");
  box.innerHTML = "";
  if (!list.length) {
    box.innerHTML =
      '<div class="card"><div class="empty">' +
      escapeHtml(t("noEventsForFilter")) +
      "</div></div>";
    return;
  }
  list.forEach((ev) => {
    const card = document.createElement("div");
    card.className = "card roster-card";
    const participants = pageState.state.persons.filter((p) =>
      p.roles.includes("participant"),
    );
    const a = participants.map((p) => {
      const e = pageState.state.attendance[p.id]?.[ev.id];
      return {
        ...p,
        status: e?.status || "unknown",
        note: e?.note || "",
      };
    });
    const yes = a.filter((x) => x.status === "yes"),
      maybe = a.filter((x) => x.status === "maybe"),
      no = a.filter((x) => x.status === "no"),
      unknown = a.filter((x) => x.status === "unknown");
    const sa = pageState.state.staffAssignments[ev.id] || {};
    const staff = Object.entries(sa)
      .flatMap(([r, ids]) =>
        ids.map((id) => {
          const p = pageState.state.persons.find((x) => x.id === id);
          const role = STAFF_ROLES.find((x) => x.id === r);
          return p ? { name: p.name, role: role ? role.label : r } : null;
        }),
      )
      .filter(Boolean);
    card.innerHTML =
      '<div class="card-head"><div><div class="event-title-line"><span class="event-date">' +
      formatDate(ev.date) +
      "</span>" +
      categoryBadge(pageState.state.categories, ev.categoryId) +
      '</div><div class="event-meta">' +
      [
        formatTimeRange(ev.startTime, ev.endTime),
        ev.location
          ? '<a href="' +
            formatMapsLink(ev.location) +
            '" target="_blank" class="location-link">' +
            escapeHtml(ev.location) +
            "</a>"
          : "",
      ]
        .filter(Boolean)
        .join(" · ") +
      "</div></div></div>" +
      (ev.description
        ? '<div class="event-desc">' +
          escapeHtml(ev.description) +
          "</div>"
        : "") +
      (pageState.editMode
        ? '<div class="attendance-edit">' +
          a
            .map(
              (p) =>
                '<div class="attendance-person-wrap"><button type="button" class="attendance-person attendance-' +
                p.status +
                '" data-person="' +
                escapeHtml(p.id) +
                '" data-event="' +
                escapeHtml(ev.id) +
                '"><span>' +
                escapeHtml(p.name) +
                "</span><small>" +
                statusLabel(p.status) +
                '</small></button><button type="button" class="note-button' +
                (p.note ? " has-note" : "") +
                '" title="' +
                escapeHtml(p.note ? t("editNote") : t("addNoteTitle")) +
                '" data-note-person="' +
                escapeHtml(p.id) +
                '" data-note-event="' +
                escapeHtml(ev.id) +
                '">💬</button><div class="note-editor" data-editor-person="' +
                escapeHtml(p.id) +
                '" data-editor-event="' +
                escapeHtml(ev.id) +
                '" hidden><input type="text" value="' +
                escapeHtml(p.note) +
                '" placeholder="' +
                escapeHtml(t("addNoteTitle")) +
                '"><button type="button" class="btn secondary note-save">' +
                escapeHtml(t("save")) +
                '</button><button type="button" class="btn secondary note-cancel">' +
                escapeHtml(t("cancel")) +
                "</button></div></div>",
            )
            .join("") +
          "</div>"
        : '<div class="attendance-summary">' +
          roster(t("goingShort"), yes, "attendance-going") +
          roster(t("maybe"), maybe, "attendance-maybe") +
          roster(t("notGoingShort"), no, "attendance-not-going") +
          (unknown.length
            ? roster(t("unknownShort"), unknown, "attendance-unknown")
            : "") +
          "</div>") +
      (pageState.staffEditMode
        ? renderStaffEditor(ev)
        : staff.length
          ? '<div class="staff-summary"><strong>' +
            escapeHtml(t("staff")) +
            '</strong><div class="roster-names">' +
            staff
              .map(
                (s) =>
                  '<span class="staff-name">' +
                  escapeHtml(s.role) +
                  ": " +
                  escapeHtml(s.name) +
                  "</span>",
              )
              .join("") +
            "</div></div>"
          : "");
    box.appendChild(card);
  });
  if (pageState.editMode) {
    box
      .querySelectorAll(".attendance-person")
      .forEach(
        (btn) =>
          (btn.onclick = () =>
            toggleAttendance(btn.dataset.person, btn.dataset.event)),
      );
    box
      .querySelectorAll(".note-button")
      .forEach(
        (btn) =>
          (btn.onclick = () =>
            openNoteEditor(btn.dataset.notePerson, btn.dataset.noteEvent)),
      );
    box
      .querySelectorAll(".note-save")
      .forEach((btn) => (btn.onclick = () => saveNote(btn)));
    box
      .querySelectorAll(".note-cancel")
      .forEach((btn) => (btn.onclick = () => closeNoteEditor(btn)));
  }
  if (pageState.staffEditMode)
    box
      .querySelectorAll(".staff-person")
      .forEach(
        (btn) =>
          (btn.onclick = () =>
            toggleStaffAssignment(
              btn.dataset.staffPerson,
              btn.dataset.staffEvent,
              btn.dataset.staffRole,
            )),
      );
}
async function toggleAttendance(personId, eventId) {
  const current =
    pageState.state.attendance[personId]?.[eventId]?.status || "unknown";
  const next =
    current === "yes" ? "maybe" : current === "maybe" ? "no" : "yes";
  try {
    await api(
      "/api/teams/" +
        encodeURIComponent(slug) +
        "/attendance/" +
        encodeURIComponent(personId) +
        "/" +
        encodeURIComponent(eventId),
      {
        method: "PUT",
        body: JSON.stringify({
          status: next,
          note: pageState.state.attendance[personId]?.[eventId]?.note || "",
        }),
      },
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
  const personId = editor.dataset.editorPerson,
    eventId = editor.dataset.editorEvent;
  const note = editor.querySelector("input").value;
  const current = pageState.state.attendance[personId]?.[eventId] || {
    status: "unknown",
    note: "",
  };
  try {
    await api(
      "/api/teams/" +
        encodeURIComponent(slug) +
        "/attendance/" +
        encodeURIComponent(personId) +
        "/" +
        encodeURIComponent(eventId),
      {
        method: "PUT",
        body: JSON.stringify({ status: current.status, note }),
      },
    );
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
