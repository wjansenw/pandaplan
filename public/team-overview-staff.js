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
