// Bulk attendance controls for the team overview.
(function () {
  let participantId = "";
  let attendanceEditMode = false;

  function matchingEvents() {
    if (!pageState?.state?.events) return [];
    return sortByDateTime(pageState.state.events.filter((event) =>
      (!pageState.dateFrom || event.date >= pageState.dateFrom) &&
      (!pageState.dateTo || event.date <= pageState.dateTo) &&
      (!pageState.categoryIds.size || pageState.categoryIds.has(event.categoryId))
    ));
  }

  function ensureBlock() {
    let block = document.getElementById("bulkAttendance");
    if (block) return block;
    block = document.createElement("div");
    block.id = "bulkAttendance";
    block.className = "card bulk-attendance";
    block.innerHTML = `
      <h2 id="bulkAttendanceToggle" class="bulk-attendance-header" role="button" tabindex="0" aria-expanded="false">
        <span>${t("bulkAttendance")}</span>
        <span class="bulk-expand-hint"><span class="bulk-chevron" aria-hidden="true">▸</span> ${t("clickToExpand")}</span>
      </h2>
      <div id="bulkAttendanceContent" hidden>
        <p class="sub">${t("bulkAttendanceHint")}</p>
        <div class="bulk-fields">
          <label>${t("participant")}
            <select id="bulkPerson"><option value="">${t("selectParticipant")}</option></select>
          </label>
        </div>
        <div class="bulk-actions">
          <span id="bulkCount">${t("eventsSelected", { count: 0 })}</span>
          <div>
            <button type="button" class="btn" data-bulk="yes">${t("goingShort")}</button>
            <button type="button" class="btn" data-bulk="maybe">${t("maybe")}</button>
            <button type="button" class="btn" data-bulk="no">${t("notGoingShort")}</button>
          </div>
        </div>
      </div>`;

    const filters = document.querySelector(".overview-filters");
    const container = document.querySelector(".wrap");
    if (filters) filters.insertAdjacentElement("afterend", block);
    else if (container) container.appendChild(block);
    else document.body.appendChild(block);

    const toggle = block.querySelector("#bulkAttendanceToggle");
    const content = block.querySelector("#bulkAttendanceContent");
    const toggleBlock = () => {
      const expanded = content.hidden;
      content.hidden = !expanded;
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.querySelector(".bulk-chevron").textContent = expanded ? "▾" : "▸";
      toggle.querySelector(".bulk-expand-hint").lastChild.textContent = expanded ? ` ${t("clickToCollapse")}` : ` ${t("clickToExpand")}`;
    };
    toggle.addEventListener("click", toggleBlock);
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBlock();
      }
    });

    const state = pageState.state;
    if (!state) return block;
    (state.persons || []).filter((p) => Array.isArray(p.roles) && p.roles.includes("participant")).sort((a, b) => a.name.localeCompare(b.name)).forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      block.querySelector("#bulkPerson").appendChild(option);
    });

    block.querySelector("#bulkPerson").addEventListener("change", (e) => {
      participantId = e.target.value;
      update();
    });
    block.querySelectorAll("[data-bulk]").forEach((button) => button.addEventListener("click", () => apply(button.dataset.bulk)));
    return block;
  }

  function render() {
    const existing = document.getElementById("bulkAttendance");
    if (!attendanceEditMode) {
      if (existing) existing.remove();
      return;
    }
    if (!pageState.state?.persons) return;
    const block = ensureBlock();
    block.querySelector("#bulkPerson").value = participantId;
    update();
  }

  function refreshTeamOverview() {
    if (typeof window.render === "function" && window.render !== render) window.render();
  }

  function update() {
    const block = document.getElementById("bulkAttendance");
    if (!block) return;
    const count = matchingEvents().length;
    block.querySelector("#bulkCount").textContent = t("eventsSelected", { count });
    block.querySelectorAll("[data-bulk]").forEach((button) => { button.disabled = !participantId || !count; });
  }

  async function apply(status) {
    const state = pageState.state;
    const events = matchingEvents();
    if (!state || !participantId || !events.length) return;
    const person = state.persons.find((p) => p.id === participantId);
    const categoryIds = pageState.categoryIds;
    const selectedCategories = (state.categories || []).filter((c) => categoryIds.has(c.id));
    const categoryLabel = categoryIds.size ? selectedCategories.map((c) => c.name).join(", ") : t("allCategories");
    const dateLabel = `${pageState.dateFrom || "…"} – ${pageState.dateTo || "…"}`;
    const label = status === "yes" ? t("goingShort") : status === "maybe" ? t("maybe") : t("notGoingShort");
    if (!confirm(t("confirmBulkAttendance", { status: label, person: person?.name || t("thisParticipant"), category: categoryLabel, count: events.length, dates: dateLabel }))) return;

    const eventIds = events.map((event) => event.id);
    try {
      const result = await api(`/api/teams/${encodeURIComponent(slug)}/attendance/bulk`, {
        method: "POST",
        body: JSON.stringify({ personId: participantId, status, eventIds, startDate: pageState.dateFrom, endDate: pageState.dateTo, categoryId: categoryIds.size === 1 ? [...categoryIds][0] : "" }),
      });
      if (!state.attendance[participantId]) state.attendance[participantId] = {};
      eventIds.forEach((eventId) => {
        const old = state.attendance[participantId][eventId] || {};
        state.attendance[participantId][eventId] = { status, note: old.note || "" };
      });
      refreshTeamOverview();
      update();
      const count = document.getElementById("bulkCount");
      if (count) count.textContent = t("eventsUpdated", { count: result?.updated ?? eventIds.length });
    } catch (error) {
      console.error("Could not save bulk attendance:", error);
      alert(t("couldNotSaveAttendance", { error: error.message || t("tryAgain") }));
    }
  }

  function syncEditMode() { setTimeout(() => { attendanceEditMode = pageState.editMode === true; render(); }, 0); }
  function watchEditButtons() {
    const attendanceButton = document.getElementById("editAttendance");
    const staffButton = document.getElementById("editStaff");
    if (attendanceButton && !attendanceButton.dataset.bulkWatched) { attendanceButton.dataset.bulkWatched = "1"; attendanceButton.addEventListener("click", syncEditMode); }
    if (staffButton && !staffButton.dataset.bulkWatched) { staffButton.dataset.bulkWatched = "1"; attendanceEditMode = false; }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `.bulk-attendance{margin-top:16px}.bulk-attendance-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0;cursor:pointer;user-select:none;font-weight:600}.bulk-attendance-header:focus-visible{outline:2px solid currentColor;outline-offset:3px}.bulk-expand-hint{display:inline-flex;align-items:center;gap:8px;font-size:.85rem;font-weight:400;color:var(--ink-soft)}.bulk-chevron{font-size:1.5em;line-height:1;opacity:.8;font-weight:600}.bulk-attendance #bulkAttendanceContent{font-weight:400}.bulk-attendance .sub{font-weight:400}.bulk-fields{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}.bulk-fields label{display:flex;flex-direction:column;gap:5px;font-size:.9rem;font-weight:400;min-width:160px}.bulk-fields select,.bulk-fields input{padding:8px 10px;border:1px solid #ccc;border-radius:6px;font:inherit;background:white;font-weight:400}.bulk-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px;font-weight:400}.bulk-actions button{margin-left:6px}.bulk-actions button:disabled{opacity:.5;cursor:not-allowed}`;
    document.head.appendChild(style);
    watchEditButtons();
    setTimeout(render, 0);
  });
})();