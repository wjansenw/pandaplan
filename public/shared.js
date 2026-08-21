// Internationalization
const MESSAGES = {
  'en': {
    attend: 'Attend',
    admin: 'Admin',
    overview: 'Overview',
    playersAttending: "Who's attending?",
    pickPlayer: 'Pick a player, then choose which events they\'ll be at.',
    player: 'Player',
    syncToCalendar: 'Sync to calendar',
    category: 'Category',
    date: 'Date',
    events: 'Events',
    goingShort: 'Going',
    notGoingShort: 'Not going',
    maybe: 'Maybe',
    addNote: 'Add a note (optional)',
    overview: 'Overview',
    whosComing: "Who's coming?",
    rosterPerEvent: 'Roster per event, based on everyone\'s pre-registrations.',
    attending: 'attending',
    noOneRegistered: 'No one has registered yet.',
    addPerson: 'Add person',
    persons: 'Persons',
    noPersonsYet: 'No persons yet.',
    categories: 'Categories',
    noCategoriesYet: 'No categories yet.',
    addCategory: 'Add category',
    newEvent: 'New event',
    cancelEdit: 'Cancel edit',
    editEvent: 'Edit event',
    eventDate: 'Date',
    startTime: 'Start time',
    endTime: 'End time',
    location: 'Location',
    description: 'Description',
    saveEvent: 'Save event',
    eventsList: 'Events',
    noEventsYet: 'No events yet — add one above.',
    removeEvent: 'Remove',
    deleteBtnText: 'Delete',
    editBtnText: 'Edit',
    staffAssignment: 'Staff assignment',
    coach: 'Coach',
    assistantCoach: 'Assistant Coach',
    trainer: 'Trainer',
  },
  'nl-BE': {
    attend: 'Aanwezig',
    admin: 'Beheer',
    overview: 'Overzicht',
    playersAttending: 'Wie komen er?',
    pickPlayer: 'Kies een speler en selecteer welke evenementen ze zullen bijwonen.',
    player: 'Speler',
    syncToCalendar: 'Synchroniseer met kalender',
    category: 'Categorie',
    date: 'Datum',
    events: 'Evenementen',
    goingShort: 'Jaaa',
    notGoingShort: 'Nee',
    maybe: 'Misschien',
    addNote: 'Voeg een opmerking toe (optioneel)',
    overview: 'Overzicht',
    whosComing: 'Wie komen er?',
    rosterPerEvent: 'Deelnemerlijst per evenement, gebaseerd op voorinschrijvingen.',
    attending: 'aanwezig',
    noOneRegistered: 'Nog niemand heeft zich aangemeld.',
    addPerson: 'Voeg persoon toe',
    persons: 'Personen',
    noPersonsYet: 'Nog geen personen.',
    categories: 'Categorieën',
    noCategoriesYet: 'Nog geen categorieën.',
    addCategory: 'Voeg categorie toe',
    newEvent: 'Nieuw evenement',
    cancelEdit: 'Annuleer bewerking',
    editEvent: 'Bewerk evenement',
    eventDate: 'Datum',
    startTime: 'Starttijd',
    endTime: 'Eindtijd',
    location: 'Locatie',
    description: 'Beschrijving',
    saveEvent: 'Sla evenement op',
    eventsList: 'Evenementen',
    noEventsYet: 'Nog geen evenementen — voeg er een toe.',
    removeEvent: 'Verwijder',
    deleteBtnText: 'Verwijder',
    editBtnText: 'Bewerk',
    staffAssignment: 'Personeelstoewizing',
    coach: 'Coach',
    assistantCoach: 'Assistent Coach',
    trainer: 'Trainer',
  }
};

let currentLanguage = navigator.language.startsWith('nl') ? 'nl-BE' : 'en';
if (!MESSAGES[currentLanguage]) currentLanguage = 'en';

function t(key) {
  return MESSAGES[currentLanguage][key] || MESSAGES['en'][key] || key;
}

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
  return d.toLocaleDateString(currentLanguage === 'nl-BE' ? 'nl-BE' : undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
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

// Roles
const PARTICIPANT_ROLE = 'participant';
const STAFF_ROLES = [
  { id: 'coach', label: 'Coach' },
  { id: 'assistant-coach', label: 'Assistant Coach' },
  { id: 'trainer', label: 'Trainer' },
];

function personHasRole(person, roleId) {
  return Array.isArray(person.roles) && person.roles.includes(roleId);
}

function staffRoleLabels(ids) {
  return STAFF_ROLES.filter(r => (ids || []).includes(r.id)).map(r => r.label);
}

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

function filterEvents(events, filters) {
  const today = todayIso();
  return events.filter(ev => {
    if (filters.categoryIds && filters.categoryIds.size && !filters.categoryIds.has(ev.categoryId)) return false;
    if (filters.dateMode === 'upcoming' && ev.date < today) return false;
    if (filters.dateMode === 'past' && ev.date >= today) return false;
    return true;
  });
}

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

function formatMapsLink(location) {
  if (!location) return '';
  const encoded = encodeURIComponent(location);
  return `https://www.google.com/maps/search/${encoded}`;
}
