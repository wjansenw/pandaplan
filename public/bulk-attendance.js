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
        <span>Bulk attendance</span>
        <span class="bulk-expand-hint"><span class="bulk-chevron" aria-hidden="true">▸</span> Click to expand</span>
      </h2>
      <div id="bulkAttendanceContent" hidden>
        <p class="sub">Set attendance for multiple events at once. Nothing changes until you choose an action and confirm it.</p>
        <div class="bulk-fields">
          <label>Participant
            <select id="bulkPerson"><option value="">Select a participant…</option></select>
          </label>
          <label>Category
            <select id="bulkCategory"><option value="">All categories</option></select>
          </label>
          <label>From
            <input id="bulkFrom" type="date">
          </label>
          <label>To
            <input id="bulkTo" type="date">
          </label>
        </div>
        <div class="bulk-actions">
          <span id="bulkCount">0 events selected</span>
          <div>
            <button type="button" class="btn" data-bulk="yes">Going</button>
            <button type="button" class="btn" data-bulk="maybe">Maybe</button>
            <button type="button" class="btn" data-bulk="no">Not going</button>
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
      toggle.querySelector('.bulk-expand-hint').lastChild.textContent = expanded ? ' Click to collapse' : ' Click to expand';
    };
    toggle.addEventListener('click', toggleBlock);
    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleBlock();
      }
    });

    const ps = (state.persons || [])
      .filter(p => Array.isArray(p.roles) && p.roles.includes('participant'))
      .sort((a, b) => a.name.localeCompare(b.name));
    ps.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      block.querySelector('#bulkPerson').appendChild(option);
    });

    (state.categories || []).slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      block.querySelector('#bulkCategory').appendChild(option);
    });

    block.querySelector('#bulkPerson').addEventListener('change', e => { participantId = e.target.value; update(); });
    block.querySelector('#bulkCategory').addEventListener('change', e => { categoryId = e.target.value; update(); });
    block.querySelector('#bulkFrom').addEventListener('change', e => { startDate = e.target.value; update(); });
    block.querySelector('#bulkTo').addEventListener('change', e => { endDate = e.target.value; update(); });
    block.querySelectorAll('[data-bulk]').forEach(button => button.addEventListener('click', () => apply(button.dataset.bulk)));
    return block;
  }

  function render() {
    const existing = document.getElementById('bulkAttendance');
    if (!isEditMode()) {
      if (existing) existing.remove();
      return;
    }
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
    block.querySelector('#bulkCount').textContent = `${count} event${count === 1 ? '' : 's'} selected`;
    block.querySelectorAll('[data-bulk]').forEach(button => {
      button.disabled = !participantId || !count || (startDate && endDate && startDate > endDate);
    });
  }

  async function apply(status) {
    const events = matchingEvents();
    if (!participantId || !events.length) return;
    if (startDate && endDate && startDate > endDate) {
      alert('The start date must not be after the end date.');
      return;
    }
    const person = state.persons.find(p => p.id === participantId);
    const category = categoryId && state.categories.find(c => c.id === categoryId);
    const label = status === 'yes' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Not going';
    const dateLabel = `${startDate || 'Any date'} → ${endDate || 'Any date'}`;
    const categoryLabel = category ? category.name : 'All categories';
    if (!confirm(`Set ${label} for ${person?.name || 'this participant'}?\n\n${categoryLabel} · ${events.length} events\n${dateLabel}\n\nThis will change attendance for all matching events.`)) return;
    try {
      const result = await api(`/api/teams/${encodeURIComponent(slug)}/attendance/bulk`, {
        method: 'POST',
        body: JSON.stringify({ personId: participantId, status, eventIds: events.map(e => e.id), startDate, endDate, categoryId })
      });
      if (!state.attendance[participantId]) state.attendance[participantId] = {};
      events.forEach(event => {
        const old = state.attendance[participantId][event.id] || {};
        state.attendance[participantId][event.id] = { status, note: old.note || '' };
      });
      window.render();
      setTimeout(() => {
        const count = document.getElementById('bulkCount');
        if (count) count.textContent = `${result.updated || 0} event${result.updated === 1 ? '' : 's'} updated`;
      }, 0);
    } catch (error) {
      console.error('Could not save bulk attendance:', error);
      alert(`Could not save attendance: ${error.message || 'Please try again.'}`);
    }
  }

  function watchEditButton() {
    const button = document.getElementById('editAttendance');
    if (!button || button.dataset.bulkWatched) return;
    button.dataset.bulkWatched = '1';
    button.addEventListener('click', () => setTimeout(render, 0));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      .bulk-attendance{margin-top:16px}
      .bulk-attendance-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0;cursor:pointer;user-select:none;font-weight:600}
      .bulk-attendance-header:focus-visible{outline:2px solid currentColor;outline-offset:3px}
      .bulk-expand-hint{display:inline-flex;align-items:center;gap:8px;font-size:.85rem;font-weight:400;color:var(--ink-soft)}
      .bulk-chevron{font-size:1.5em;line-height:1;opacity:.8;font-weight:600}
      .bulk-attendance #bulkAttendanceContent{font-weight:400}
      .bulk-attendance .sub{font-weight:400}
      .bulk-fields{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
      .bulk-fields label{display:flex;flex-direction:column;gap:5px;font-size:.9rem;font-weight:400;min-width:160px}
      .bulk-fields select,.bulk-fields input{padding:8px 10px;border:1px solid #ccc;border-radius:6px;font:inherit;background:white;font-weight:400}
      .bulk-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px;font-weight:400}
      .bulk-actions button{margin-left:6px}
      .bulk-actions button:disabled{opacity:.5;cursor:not-allowed}
    `;
    document.head.appendChild(style);
    watchEditButton();
    setTimeout(render, 0);
  });
})();
