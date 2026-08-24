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

const staffSummaryObserver = new MutationObserver(groupStaffSummary);
document.addEventListener('DOMContentLoaded', () => {
  const events = document.getElementById('events');
  if (events) staffSummaryObserver.observe(events, { childList: true, subtree: true });
  groupStaffSummary();
});

document.addEventListener('click', event => {
  if (window.__teamOverviewEditSwitching) return;
  const target = event.target.closest('#editAttendance, #editStaff');
  if (!target) return;
  const attendanceButton = document.getElementById('editAttendance');
  const staffButton = document.getElementById('editStaff');
  if (!attendanceButton || !staffButton) return;
  const otherButton = target.id === 'editAttendance' ? staffButton : attendanceButton;
  if (!otherButton.textContent.startsWith('Done ')) return;
  window.__teamOverviewEditSwitching = true;
  otherButton.click();
  window.__teamOverviewEditSwitching = false;
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('attend')?.remove();
  document.getElementById('staff')?.remove();
});

// Add subjects to the cards after every render. Use the same filtering and
// sorting functions as team-overview.html so the subject always matches the
// visible event, including the upcoming/past/all date filters.
function addOverviewSubjects() {
  const eventBox = document.getElementById('events');
  if (!eventBox || typeof state === 'undefined' || !state.events) return;

  const apply = () => {
    if (typeof state === 'undefined' || !state.events) return;
    const visibleEvents = sortByDateTime(filterEvents(state.events, { categoryIds: new Set(), dateMode }));
    const cards = eventBox.querySelectorAll('.roster-card');
    cards.forEach((card, index) => {
      const ev = visibleEvents[index];
      if (!ev || !ev.subject || card.querySelector('.event-subject')) return;
      const titleLine = card.querySelector('.event-title-line');
      if (!titleLine) return;
      const subject = document.createElement('div');
      subject.className = 'event-subject';
      subject.textContent = ev.subject;
      titleLine.insertAdjacentElement('afterend', subject);
    });
  };

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(eventBox, { childList: true });

  if (!document.getElementById('overview-wrap-fix')) {
    const style = document.createElement('style');
    style.id = 'overview-wrap-fix';
    style.textContent = `
      .roster-card, .attendance-summary, .attendance-group, .staff-summary,
      .staff-summary .roster-names, .roster-names { min-width: 0; max-width: 100%; }
      .attendance-summary, .attendance-group, .staff-summary .roster-names,
      .roster-names { overflow-wrap: anywhere; word-break: normal; }
      .attendance-group .roster-names { white-space: normal; }
      .roster-name, .staff-name { overflow-wrap: anywhere; word-break: break-word; }
      .event-subject { margin-top: 3px; font-size: 1.05rem; font-weight: 600; overflow-wrap: anywhere; }
    `;
    document.head.appendChild(style);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // load() is async; wait for the first state/render, then observe subsequent renders.
  const wait = setInterval(() => {
    if (typeof state !== 'undefined' && state?.events) {
      clearInterval(wait);
      addOverviewSubjects();
    }
  }, 10);
  setTimeout(() => clearInterval(wait), 5000);
});

// Bulk attendance is deliberately only exposed while Edit attendance is active.
// The participant selector is limited to people with the participant role, and
// the action always requires explicit confirmation before changing anything.
let bulkAttendanceParticipantId = '';
let bulkAttendanceCategoryId = '';

function bulkAttendanceEvents() {
  if (typeof state === 'undefined' || !state.events) return [];
  const filtered = state.events.filter(ev => !bulkAttendanceCategoryId || ev.categoryId === bulkAttendanceCategoryId);
  return filterEvents(filtered, { categoryIds: new Set(), dateMode });
}

function updateBulkAttendanceCount() {
  const count = document.getElementById('bulkAttendanceCount');
  const action = document.getElementById('bulkAttendanceAction');
  if (!count || !action) return;
  const total = bulkAttendanceEvents().length;
  count.textContent = t('eventsTotal', { count: total });
  action.disabled = !bulkAttendanceParticipantId || total === 0;
}

function renderBulkAttendance() {
  const existing = document.getElementById('bulkAttendance');
  const editButton = document.getElementById('editAttendance');
  const editing = editButton && editButton.textContent.startsWith('Done ');
  if (!editing) {
    existing?.remove();
    return;
  }
  if (existing) {
    updateBulkAttendanceCount();
    return;
  }
  const participants = state.persons.filter(p => Array.isArray(p.roles) && p.roles.includes('participant')).sort((a, b) => a.name.localeCompare(b.name));
  if (!participants.length) return;

  const block = document.createElement('div');
  block.id = 'bulkAttendance';
  block.className = 'card bulk-attendance';
  block.innerHTML = `
    <h2>${escapeHtml(t('events'))} · ${escapeHtml(t('attend'))}</h2>
    <p class="sub">${escapeHtml(t('pickPlayer'))}</p>
    <div class="bulk-attendance-fields">
      <label>${escapeHtml(t('player'))}<select id="bulkAttendanceParticipant"><option value="">${escapeHtml(t('pickPlayerPrompt'))}</option></select></label>
      <label>${escapeHtml(t('category'))}<select id="bulkAttendanceCategory"><option value="">${escapeHtml(t('all'))}</option></select></label>
    </div>
    <div class="bulk-attendance-actions">
      <span id="bulkAttendanceCount" class="bulk-attendance-count"></span>
      <div class="bulk-attendance-buttons">
        <button type="button" class="btn" data-bulk-status="yes">${escapeHtml(t('goingShort'))}</button>
        <button type="button" class="btn" data-bulk-status="maybe">${escapeHtml(t('maybe'))}</button>
        <button type="button" class="btn" data-bulk-status="no">${escapeHtml(t('notGoingShort'))}</button>
      </div>
    </div>`;

  participants.forEach(person => {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = person.name;
    block.querySelector('#bulkAttendanceParticipant').appendChild(option);
  });
  state.categories.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    block.querySelector('#bulkAttendanceCategory').appendChild(option);
  });

  document.querySelector('.calendar-section')?.insertAdjacentElement('afterend', block);
  const participant = block.querySelector('#bulkAttendanceParticipant');
  const category = block.querySelector('#bulkAttendanceCategory');
  participant.value = bulkAttendanceParticipantId;
  category.value = bulkAttendanceCategoryId;
  participant.onchange = () => { bulkAttendanceParticipantId = participant.value; updateBulkAttendanceCount(); };
  category.onchange = () => { bulkAttendanceCategoryId = category.value; updateBulkAttendanceCount(); };
  block.querySelectorAll('[data-bulk-status]').forEach(button => {
    button.onclick = () => applyBulkAttendance(button.dataset.bulkStatus);
  });
  updateBulkAttendanceCount();
}

async function applyBulkAttendance(status) {
  if (!bulkAttendanceParticipantId) return;
  const events = bulkAttendanceEvents();
  if (!events.length) return;
  const person = state.persons.find(p => p.id === bulkAttendanceParticipantId);
  const statusText = status === 'yes' ? t('goingShort') : status === 'maybe' ? t('maybe') : t('notGoingShort');
  const category = bulkAttendanceCategoryId ? state.categories.find(c => c.id === bulkAttendanceCategoryId) : null;
  const scope = category ? category.name : t('all');
  const message = `${statusText} · ${scope} · ${person ? person.name : ''}\n\n${events.length} ${t('events').toLowerCase()}`;
  if (!window.confirm(message + '\n\nOK?')) return;
  try {
    const result = await api('/api/teams/' + encodeURIComponent(slug) + '/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ personId: bulkAttendanceParticipantId, status, eventIds: events.map(ev => ev.id) })
    });
    if (!state.attendance[bulkAttendanceParticipantId]) state.attendance[bulkAttendanceParticipantId] = {};
    events.forEach(ev => {
      const current = state.attendance[bulkAttendanceParticipantId][ev.id] || {};
      state.attendance[bulkAttendanceParticipantId][ev.id] = { status, note: current.note || '' };
    });
    render();
    renderBulkAttendance();
    updateBulkAttendanceCount();
    const count = document.getElementById('bulkAttendanceCount');
    if (count) count.textContent = (result.updated || events.length) + ' · ' + t('saved');
  } catch (error) {
    console.error('Could not bulk update attendance:', error);
    alert('Could not save attendance. Please try again.');
  }
}

const originalRenderForBulkAttendance = window.render;
if (typeof originalRenderForBulkAttendance === 'function') {
  window.render = function () {
    originalRenderForBulkAttendance.apply(this, arguments);
    renderBulkAttendance();
  };
}

document.addEventListener('click', event => {
  if (event.target.closest('#editAttendance')) {
    setTimeout(renderBulkAttendance, 0);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .bulk-attendance { margin-top: 16px; }
    .bulk-attendance h2 { margin-bottom: 4px; }
    .bulk-attendance-fields { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
    .bulk-attendance-fields label { display: flex; flex-direction: column; gap: 5px; font-size: .9rem; font-weight: 600; min-width: 180px; }
    .bulk-attendance-fields select { padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font: inherit; background: white; }
    .bulk-attendance-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
    .bulk-attendance-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
    .bulk-attendance-buttons .btn:disabled { opacity: .5; cursor: not-allowed; }
    .bulk-attendance-count { color: var(--ink-soft); font-size: .9rem; }
  `;
  document.head.appendChild(style);
});
