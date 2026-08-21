async function api(path, opts) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    let msg = 'Request failed: ' + path;
    try { const body = await res.json(); if (body.error) msg = body.error; } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTimeRange(startTime, endTime) {
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  if (startTime) return `From ${startTime}`;
  if (endTime) return `Until ${endTime}`;
  return '';
}

function categoryById(categories, id) {
  return categories.find(c => c.id === id) || null;
}

function categoryBadge(categories, categoryId) {
  const cat = categoryById(categories, categoryId);
  if (!cat) return '<span class="badge" style="background:#0000000f;color:var(--ink-soft)">Uncategorized</span>';
  return `<span class="badge" style="background:${cat.color}22;color:${cat.color}">
    <span class="badge-dot" style="background:${cat.color}"></span>${escapeHtml(cat.name)}
  </span>`;
}

// Renders a row of chip buttons for choosing a single category (plus a
// "No category" option). Only one chip is active at a time.
// Deliberately not a <select>: once options are built dynamically and
// re-rendered, native <select>/<option> selection state is handled
// inconsistently across browsers (notably Firefox), so plain clickable
// buttons are used everywhere a persistent single-choice picker is needed.
function renderCategoryChips(container, categories, selectedId, onSelect, opts) {
  opts = opts || {};
  container.innerHTML = '';
  function makeChip(id, name, color) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = name;
    if (id === selectedId) {
      chip.classList.add('active');
      if (color) {
        chip.style.background = color + '22';
        chip.style.borderColor = color;
        chip.style.color = color;
      }
    }
    chip.addEventListener('click', () => onSelect(id));
    container.appendChild(chip);
  }
  makeChip(null, opts.noneLabel || 'No category', null);
  categories.forEach(c => makeChip(c.id, c.name, c.color));
}

function sortByDateTime(events) {
  return events.slice().sort((a, b) => {
    const da = a.date + 'T' + (a.startTime || '00:00');
    const db = b.date + 'T' + (b.startTime || '00:00');
    return da.localeCompare(db);
  });
}

// Renders a readonly URL field + copy button for subscribing a calendar
// app to an .ics feed. `label` is shown above the field.
function renderSubscribeBox(container, url, label) {
  container.innerHTML = `
    <h3>${escapeHtml(label)}</h3>
    <div class="subscribe-row">
      <input type="text" readonly value="${escapeHtml(url)}" onclick="this.select()">
      <button type="button" class="btn secondary">Copy</button>
      <a class="btn" href="${escapeHtml(url)}">Download</a>
    </div>
    <div class="subscribe-hint">Paste this link into your calendar app's "subscribe by URL" option to keep it in sync automatically.</div>
  `;
  const copyBtn = container.querySelector('.btn.secondary');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = 'Copied!';
    } catch (e) {
      container.querySelector('input').select();
      copyBtn.textContent = 'Select & copy';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });
}

// Fixed role vocabulary, mirrored from server.js. "participant" is the
// ordinary attendee role; scorekeeper/referee are staff roles. A person
// can hold any combination of these at once.
const PARTICIPANT_ROLE = 'participant';
const STAFF_ROLES = [
  { id: 'scorekeeper', label: 'Scorekeeper' },
  { id: 'referee', label: 'Referee' },
];

function personHasRole(person, roleId) {
  return Array.isArray(person.roles) && person.roles.includes(roleId);
}

function staffRoleLabels(ids) {
  return STAFF_ROLES.filter(r => (ids || []).includes(r.id)).map(r => r.label);
}

// Generic multi-select chip row: options = [{id, label}], selectedSet is
// a Set of selected ids. Toggles membership on click. Used for choosing a
// person's roles and a category's required staff roles.
function renderMultiSelectChips(container, options, selectedSet, onToggle) {
  container.innerHTML = '';
  options.forEach(opt => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (selectedSet.has(opt.id) ? ' active' : '');
    chip.textContent = opt.label;
    chip.addEventListener('click', () => {
      if (selectedSet.has(opt.id)) selectedSet.delete(opt.id);
      else selectedSet.add(opt.id);
      onToggle();
    });
    container.appendChild(chip);
  });
}

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// filters = { categoryIds: Set<string|null>, dateMode: 'upcoming'|'past'|'all' }
// An empty categoryIds set means "no category filter applied" (show all).
function filterEvents(events, filters) {
  const today = todayIso();
  return events.filter(ev => {
    if (filters.categoryIds && filters.categoryIds.size && !filters.categoryIds.has(ev.categoryId)) return false;
    if (filters.dateMode === 'upcoming' && ev.date < today) return false;
    if (filters.dateMode === 'past' && ev.date >= today) return false;
    return true;
  });
}

// Multi-select category filter chips. selectedIds is a Set (possibly
// containing null for "Uncategorized"). Clicking "All" clears the set.
// Clicking a category toggles its membership.
function renderCategoryFilterChips(container, categories, selectedIds, onChange) {
  container.innerHTML = '';
  function makeChip(id, name, color, isAll) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = name;
    const isActive = isAll ? selectedIds.size === 0 : selectedIds.has(id);
    if (isActive) {
      chip.classList.add('active');
      if (color) {
        chip.style.background = color + '22';
        chip.style.borderColor = color;
        chip.style.color = color;
      }
    }
    chip.addEventListener('click', () => {
      if (isAll) {
        selectedIds.clear();
      } else if (selectedIds.has(id)) {
        selectedIds.delete(id);
      } else {
        selectedIds.add(id);
      }
      onChange();
    });
    container.appendChild(chip);
  }
  makeChip('__all__', 'All', null, true);
  categories.forEach(c => makeChip(c.id, c.name, c.color, false));
  makeChip(null, 'Uncategorized', null, false);
}

function renderDateFilterChips(container, currentMode, onChange) {
  container.innerHTML = '';
  const options = [
    { mode: 'upcoming', label: 'Upcoming' },
    { mode: 'past', label: 'Past' },
    { mode: 'all', label: 'All dates' },
  ];
  options.forEach(opt => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (opt.mode === currentMode ? ' active' : '');
    chip.textContent = opt.label;
    chip.addEventListener('click', () => onChange(opt.mode));
    container.appendChild(chip);
  });
}
