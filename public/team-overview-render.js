function renderTeamOverview() {
  renderDateFilterChips(
    document.getElementById("dates"),
    pageState.dateMode,
    (m) => {
      pageState.dateMode = m;
      renderTeamOverview();
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
      return { ...p, status: e?.status || "unknown", note: e?.note || "" };
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
        ? '<div class="event-desc">' + escapeHtml(ev.description) + "</div>"
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
}

function handleEventClick(event) {
  const target = event.target.closest("button, .staff-person");
  if (!target) return;
  if (target.matches(".attendance-person")) {
    toggleAttendance(target.dataset.person, target.dataset.event);
  } else if (target.matches(".note-button")) {
    openNoteEditor(target.dataset.notePerson, target.dataset.noteEvent);
  } else if (target.matches(".note-save")) {
    saveNote(target);
  } else if (target.matches(".note-cancel")) {
    closeNoteEditor(target);
  } else if (target.matches(".staff-person")) {
    toggleStaffAssignment(
      target.dataset.staffPerson,
      target.dataset.staffEvent,
      target.dataset.staffRole,
    );
  }
}
