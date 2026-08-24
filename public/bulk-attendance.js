// Bulk attendance controls for the team overview.
(function () {
  let participantId = '';
  let categoryId = '';
  let startDate = '';
  let endDate = '';

  function matchingEvents() {
    if (typeof state === 'undefined' || !state.events) return [];
    return state.events.filter(e =>
      (!categoryId || e.categoryId === categoryId) &&
      (!startDate || e.date >= startDate) &&
      (!endDate || e.date <= endDate)
    );
  }

  function isEditMode() {
    const button = document.getElementById('editAttendance');
    return !!button && /^Done\s+attendance/i.test(button.textContent.trim());
  }

  function ensureBlock() {
    let block = document.getElementById('bulkAttendance');
    if (block) return block;
    block = document.createElement('div');
    block.id = 'bulkAttendance';
    block.className = 'card bulk-attendance';
    block.innerHTML = `
      <h2 id="bulkAttendanceToggle" class="bulk-attendance-header" role="button" tabindex="0" aria-expanded="false">
        <span>${t('bulkAttendance')}</span>
        <span class="bulk-expand-hint"><span class="bulk-chevron" aria-hidden="true">▸</span> ${t('clickToExpand')}</span>
      </h2>
      <div id="bulkAttendanceContent" hidden>
        <p class="sub">${t('bulkAttendanceHint')}</p>
        <div class="bulk-fields">
          <label>${t('participant')}
            <select id="bulkPerson"><option value="">${t('selectParticipant')}</option></select>
          </label>
          <label>${t('category')}
            <select id="bulkCategory"><option value="">${t('allCategories')}</option></select>
          </label>
          <label>${t('fromDate')}
            <input id="bulkFrom" type="date">
          </label>
          <label>${t('toDate')}
            <input id="bulkTo" type="date">
          </label>
        </div>
        <div class="bulk-actions">
          <span id="bulkCount">${t('eventsSelected', { count: 0 })}</span>
          <div>
            <button type="button" class="btn" data-bulk="yes">${t('goingShort')}</button>
            <button type="button" class="btn" data-bulk="maybe">${t('maybe')}</button>
            <button type="button" class="btn" data-bulk="no">${t('notGoingShort')}</button>
          </div>
        </div>
      </div>`;
    const calendar = document.querySelector('.calendar-section');
    const container = document.querySelector('.wrap');
    if (calendar) calendar.insertAdjacentElement('afterend', block);
    else if (container) container.prepend(block);
    else document.body.appendChild(block);
    const toggle = block.querySelector('#bulkAttendanceToggle');
    const content = block.querySelector('#bulkAttendanceContent');
    const toggleBlock = () => {
      const expanded = content.hidden;
      content.hidden = !expanded;
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.querySelector('.bulk-chevron').textContent = expanded ? '▾' : '▸';
      toggle.querySelector('.bulk-expand-hint').lastChild.textContent = expanded ? ` ${t('clickToCollapse')}` : ` ${t('clickToExpand')}`;
    };
    toggle.addEventListener('click', toggleBlock);
    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBlock(); }
    });
    const ps = (state.persons || []).filter(p => Array.isArray(p.roles) && p.roles.includes('participant')).sort((a, b) => a.name.localeCompare(b.name));
    ps.forEach(p => { const option = document.createElement('option'); option.value = p.id; option.textContent = p.name; block.querySelector('#bulkPerson').appendChild(option); });
    (state.categories || []).slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(c => { const option = document.createElement('option'); option.value = c.id; option.textContent = c.name; block.querySelector('#bulkCategory').appendChild(option); });
    block.querySelector('#bulkPerson').addEventListener('change', e => { participantId = e.target.value; update(); });
    block.querySelector('#bulkCategory').addEventListener('change', e => { categoryId = e.target.value; update(); });
    block.querySelector('#bulkFrom').addEventListener('change', e => { startDate = e.target.value; update(); });
    block.querySelector('#bulkTo').addEventListener('change', e => { endDate = e.target.value; update(); });
    block.querySelectorAll('[data-bulk]').forEach(button => button.addEventListener('click', () => apply(button.dataset.bulk)));
    return block;
  }

  function render() {
    const existing = document.getElementById('bulkAttendance');
    if (!isEditMode()) { if (existing) existing.remove(); return; }
    if (typeof state === 'undefined' || !state.persons || !state.categories) return;
    const block = ensureBlock();
    block.querySelector('#bulkPerson').value = participantId;
    block.querySelector('#bulkCategory').value = categoryId;
    block.querySelector('#bulkFrom').value = startDate;
    block.querySelector('#bulkTo').value = endDate;
    update();
  }

  function update() {
    const block = document.getElementById('bulkAttendance');
    if (!block) return;
    const count = matchingEvents().length;
    block.querySelector('#bulkCount').textContent = t('eventsSelected', { count });
    block.querySelectorAll('[data-bulk]').forEach(button => { button.disabled = !participantId || !count || (startDate && endDate && startDate > endDate); });
  }

  async function apply(status) {
    const events = matchingEvents();
    if (!participantId || !events.length) return;
    if (startDate && endDate && startDate > endDate) { alert(t('invalidDateRange')); return; }
    const person = state.persons.find(p => p.id === participantId);
    const category = categoryId && state.categories.find(c => c.id === categoryId);
    const label = status === 'yes' ? t('goingShort') : status === 'maybe' ? t('maybe') : t('notGoingShort');
    const dateLabel = `${startDate || t('anyDate')} → ${endDate || t('anyDate')}`;
    const categoryLabel = category ? category.name : t('allCategories');
    if (!confirm(t('confirmBulkAttendance', { status: label, person: person?.name || t('thisParticipant'), category: categoryLabel, count: events.length, dates: dateLabel }))) return;
    try {
      const result = await api(`/api/teams/${encodeURIComponent(slug)}/attendance/bulk`, { method: 'POST', body: JSON.stringify({ personId: participantId, status, eventIds: events.map(e => e.id), startDate, endDate, categoryId }) });
      if (!state.attendance[participantId]) state.attendance[participantId] = {};
      events.forEach(event => { const old = state.attendance[participantId][event.id] || {}; state.attendance[participantId][event.id] = { status, note: old.note || '' }; });
      window.render();
      setTimeout(() => { const count = document.getElementById('bulkCount'); if (count) count.textContent = t('eventsUpdated', { count: result.updated || 0 }); }, 0);
    } catch (error) { console.error('Could not save bulk attendance:', error); alert(t('couldNotSaveAttendance', { error: error.message || t('tryAgain') })); }
  }

  function watchEditButton() {
    const button = document.getElementById('editAttendance');
    if (!button || button.dataset.bulkWatched) return;
    button.dataset.bulkWatched = '1';
    button.addEventListener('click', () => setTimeout(render, 0));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `.bulk-attendance{margin-top:16px}.bulk-attendance-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0;cursor:pointer;user-select:none;font-weight:600}.bulk-attendance-header:focus-visible{outline:2px solid currentColor;outline-offset:3px}.bulk-expand-hint{display:inline-flex;align-items:center;gap:8px;font-size:.85rem;font-weight:400;color:var(--ink-soft)}.bulk-chevron{font-size:1.5em;line-height:1;opacity:.8;font-weight:600}.bulk-attendance #bulkAttendanceContent{font-weight:400}.bulk-attendance .sub{font-weight:400}.bulk-fields{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}.bulk-fields label{display:flex;flex-direction:column;gap:5px;font-size:.9rem;font-weight:400;min-width:160px}.bulk-fields select,.bulk-fields input{padding:8px 10px;border:1px solid #ccc;border-radius:6px;font:inherit;background:white;font-weight:400}.bulk-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px;font-weight:400}.bulk-actions button{margin-left:6px}.bulk-actions button:disabled{opacity:.5;cursor:not-allowed}`;
    document.head.appendChild(style);
    watchEditButton();
    setTimeout(render, 0);
  });

  // Translate the remaining literal UI text on the team overview. This keeps
  // older inline HTML compatible with the central translation dictionary.
  const literalKeys = {
    'Overview':'overview','Team overview':'teamOverview','Attendance and staff assignments for this Team.':'teamOverviewSubtitle',
    'Edit attendance':'editAttendance','Done attendance':'doneAttendance','Edit staff':'editStaff','Done staff':'doneStaff',
    'Calendar':'calendar','Subscribe to this Team\'s events in your calendar app.':'subscribeTeamCalendar',
    'Subscribe to a person\'s events':'subscribePersonCalendar','Select a person to get a calendar containing events where that person is going or is assigned as staff.':'subscribePersonCalendarHint',
    'Select a person…':'selectPerson','Select a person first':'selectPersonFirst','No events match this filter.':'noFilterMatch',
    'Going':'goingShort','Maybe':'maybe','Not going':'notGoingShort','Unknown':'unknownShort','Staff':'staffLabel',
    'Add note':'addNoteShort','Edit note':'editNote','Save':'save','Cancel':'cancel','Could not save attendance. Please try again.':'couldNotSaveAttendanceShort','Could not save note. Please try again.':'couldNotSaveNote'
  };
  function translateLiteralUI(root=document) {
    if (typeof t !== 'function') return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walk.nextNode()) nodes.push(walk.currentNode);
    nodes.forEach(node=>{
      const raw=node.nodeValue;
      const trimmed=raw.trim();
      const key=literalKeys[trimmed];
      if(key){ node.nodeValue=raw.replace(trimmed,t(key)); }
    });
    root.querySelectorAll?.('input[placeholder],input[title],button[title]').forEach(el=>{
      const attr=el.placeholder!==undefined?'placeholder':'title';
      const key=literalKeys[el.getAttribute(attr)];
      if(key) el.setAttribute(attr,t(key));
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    translateLiteralUI();
    new MutationObserver(mutations=>mutations.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===Node.ELEMENT_NODE) translateLiteralUI(n);}))).observe(document.body,{childList:true,subtree:true});
  });
})();
