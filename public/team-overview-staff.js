function staffRoleLabel(roleId) {
  const role = STAFF_ROLES.find(r => r.id === roleId);
  return role ? role.label : roleId;
}

function eventRequiredStaffRoles(ev) {
  const category = state.categories.find(c => c.id === ev.categoryId);
  return category && Array.isArray(category.requiredStaffRoles) ? category.requiredStaffRoles : [];
}

function renderStaffEditor(ev) {
  const roles = eventRequiredStaffRoles(ev);
  if (!roles.length) return '';
  const assignments = state.staffAssignments[ev.id] || {};
  return '<div class="staff-edit">' + roles.map(role => {
    const selected = new Set(assignments[role] || []);
    const eligible = state.persons.filter(p => personHasRole(p, role));
    return '<div class="staff-role-group"><div class="staff-role-title">' + escapeHtml(staffRoleLabel(role)) + '</div>' +
      (eligible.length ? '<div class="staff-person-list">' + eligible.map(p =>
        '<button type="button" class="staff-person ' + (selected.has(p.id) ? 'staff-selected' : 'staff-unselected') + '" data-staff-person="' + escapeHtml(p.id) + '" data-staff-event="' + escapeHtml(ev.id) + '" data-staff-role="' + escapeHtml(role) + '">' +
        escapeHtml(p.name) + (selected.has(p.id) ? ' ✓' : '') + '</button>'
      ).join('') + '</div>' : '<div class="staff-empty">No eligible staff</div>') +
      '</div>';
  }).join('') + '</div>';
}

async function toggleStaffAssignment(personId, eventId, role) {
  const assignments = state.staffAssignments[eventId] || {};
  const selected = (assignments[role] || []).includes(personId);
  try {
    if (selected) {
      await api('/api/teams/' + encodeURIComponent(slug) + '/staffAssignments/' + encodeURIComponent(eventId) + '/' + encodeURIComponent(personId) + '/' + encodeURIComponent(role), { method: 'DELETE' });
      if (assignments[role]) assignments[role] = assignments[role].filter(id => id !== personId);
    } else {
      await api('/api/teams/' + encodeURIComponent(slug) + '/staffAssignments/' + encodeURIComponent(eventId) + '/' + encodeURIComponent(personId), { method: 'PUT', body: JSON.stringify({ role }) });
      if (!state.staffAssignments[eventId]) state.staffAssignments[eventId] = {};
      Object.keys(state.staffAssignments[eventId]).forEach(existingRole => {
        state.staffAssignments[eventId][existingRole] = (state.staffAssignments[eventId][existingRole] || []).filter(id => id !== personId);
      });
      state.staffAssignments[eventId][role] = [...(state.staffAssignments[eventId][role] || []), personId];
    }
    render();
  } catch (error) {
    console.error('Could not update staff assignment:', error);
    alert('Could not save staff assignment. Please try again.');
  }
}

// Combine assigned staff with the same role into a single pill, e.g.
// "Referee: Wim, Luk", while keeping the existing styling.
function groupStaffSummary() {
  document.querySelectorAll('.staff-summary .roster-names').forEach(container => {
    if (container.dataset.grouped === 'true') return;
    const groups = new Map();
    container.querySelectorAll('.staff-name').forEach(item => {
      const text = item.textContent.trim();
      const separator = text.indexOf(':');
      const role = separator >= 0 ? text.slice(0, separator).trim() : '';
      const person = separator >= 0 ? text.slice(separator + 1).trim() : text;
      if (!groups.has(role)) groups.set(role, []);
      groups.get(role).push(person);
    });
    if (!groups.size) return;
    container.innerHTML = '';
    groups.forEach((people, role) => {
      const item = document.createElement('span');
      item.className = 'staff-name';
      item.textContent = role ? role + ': ' + people.join(', ') : people.join(', ');
      container.appendChild(item);
    });
    container.dataset.grouped = 'true';
  });
}

// render() rebuilds the event cards, so observe those changes and regroup the
// normal-mode staff summary after every render.
const staffSummaryObserver = new MutationObserver(groupStaffSummary);
document.addEventListener('DOMContentLoaded', () => {
  const events = document.getElementById('events');
  if (events) staffSummaryObserver.observe(events, { childList: true, subtree: true });
  groupStaffSummary();
});

// Attendance and staff editing are deliberately mutually exclusive. The
// inline handlers in team-overview.html toggle their own mode first; this
// listener then closes the other mode when necessary. A guard prevents the
// programmatic click from recursively switching the modes back and forth.
document.addEventListener('click', event => {
  if (window.__teamOverviewEditSwitching) return;
  const target = event.target.closest('#editAttendance, #editStaff');
  if (!target) return;

  const attendanceButton = document.getElementById('editAttendance');
  const staffButton = document.getElementById('editStaff');
  if (!attendanceButton || !staffButton) return;

  const otherButton = target.id === 'editAttendance' ? staffButton : attendanceButton;
  const otherIsEditing = otherButton.textContent.startsWith('Done ');
  if (!otherIsEditing) return;

  window.__teamOverviewEditSwitching = true;
  otherButton.click();
  window.__teamOverviewEditSwitching = false;
});

// Attend and Staff are now part of the combined Overview. Remove their
// obsolete navigation entries rather than leaving dead links in the menu.
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('attend')?.remove();
  document.getElementById('staff')?.remove();
});
