function staffRoleLabel(roleId) {
  const role = STAFF_ROLES.find((r) => r.id === roleId);
  return role ? role.label : roleId;
}

function eventRequiredStaffRoles(ev) {
  const category = pageState.state.categories.find(
    (c) => c.id === ev.categoryId,
  );
  return category && Array.isArray(category.requiredStaffRoles)
    ? category.requiredStaffRoles
    : [];
}

function renderStaffEditor(ev) {
  const roles = eventRequiredStaffRoles(ev);
  if (!roles.length) return "";
  const assignments = pageState.state.staffAssignments[ev.id] || {};
  return (
    '<div class="staff-edit">' +
    roles
      .map((role) => {
        const selected = new Set(assignments[role] || []);
        const eligible = pageState.state.persons.filter((p) =>
          personHasRole(p, role),
        );
        return (
          '<div class="staff-role-group"><div class="staff-role-title">' +
          escapeHtml(staffRoleLabel(role)) +
          "</div>" +
          (eligible.length
            ? '<div class="staff-person-list">' +
              eligible
                .map(
                  (p) =>
                    '<button type="button" class="staff-person ' +
                    (selected.has(p.id)
                      ? "staff-selected"
                      : "staff-unselected") +
                    '" data-staff-person="' +
                    escapeHtml(p.id) +
                    '" data-staff-event="' +
                    escapeHtml(ev.id) +
                    '" data-staff-role="' +
                    escapeHtml(role) +
                    '">' +
                    escapeHtml(p.name) +
                    (selected.has(p.id) ? " ✓" : "") +
                    "</button>",
                )
                .join("") +
              "</div>"
            : '<div class="staff-empty">' +
              escapeHtml(t("noEligibleStaff")) +
              "</div>") +
          "</div>"
        );
      })
      .join("") +
    "</div>"
  );
}

async function toggleStaffAssignment(personId, eventId, role) {
  const assignments = pageState.state.staffAssignments[eventId] || {};
  const selected = (assignments[role] || []).includes(personId);
  try {
    if (selected) {
      await api(
        "/api/teams/" +
          encodeURIComponent(slug) +
          "/staffAssignments/" +
          encodeURIComponent(eventId) +
          "/" +
          encodeURIComponent(personId) +
          "/" +
          encodeURIComponent(role),
        { method: "DELETE" },
      );
    } else {
      await api(
        "/api/teams/" +
          encodeURIComponent(slug) +
          "/staffAssignments/" +
          encodeURIComponent(eventId) +
          "/" +
          encodeURIComponent(personId),
        { method: "PUT", body: JSON.stringify({ role }) },
      );
    }

    pageState.state = await getTeamState(slug);
    render();
  } catch (error) {
    console.error("Could not update staff assignment:", error);
    alert(t("couldNotSaveStaffAssignment"));
  }
}

function groupStaffSummary() {
  document
    .querySelectorAll(".staff-summary .roster-names")
    .forEach((container) => {
      if (container.dataset.grouped === "true") return;
      const groups = new Map();
      container.querySelectorAll(".staff-name").forEach((item) => {
        const text = item.textContent.trim();
        const separator = text.indexOf(":");
        const role = separator >= 0 ? text.slice(0, separator).trim() : "";
        const person = separator >= 0 ? text.slice(separator + 1).trim() : text;
        if (!groups.has(role)) groups.set(role, []);
        groups.get(role).push(person);
      });
      if (!groups.size) return;
      container.innerHTML = "";
      groups.forEach((people, role) => {
        const item = document.createElement("span");
        item.className = "staff-name";
        item.textContent = role
          ? role + ": " + people.join(", ")
          : people.join(", ");
        container.appendChild(item);
      });
      container.dataset.grouped = "true";
    });
}

const staffSummaryObserver = new MutationObserver(groupStaffSummary);
document.addEventListener("DOMContentLoaded", () => {
  const events = document.getElementById("events");
  if (events)
    staffSummaryObserver.observe(events, { childList: true, subtree: true });
  groupStaffSummary();
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("attend")?.remove();
  document.getElementById("staff")?.remove();
});
