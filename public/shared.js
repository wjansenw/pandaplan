// Internationalization
const MESSAGES = {
  'en': {
    // nav
    overview: 'Overview',
    attend: 'Attend',
    staffNav: 'Staff',
    admin: 'Admin',

    // common
    save: 'Save',
    saved: 'Saved',
    added: 'Added.',
    cancel: 'Cancel',
    remove: 'Remove',
    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    retry: 'Could not save — retry',
    noCategory: 'No category',
    uncategorized: 'Uncategorized',
    all: 'All',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download',
    selectAndCopy: 'Select & copy',
    noEventsYet: 'No events yet — add some in Admin first.',
    staffNeeded: 'Staff needed',

    // filters
    category: 'Category',
    date: 'Date',
    upcoming: 'Upcoming',
    past: 'Past',
    allDates: 'All dates',
    noFilterMatch: 'No events match the current filters.',

    // sync
    syncToCalendar: 'Sync to calendar',
    syncFullSchedule: 'Sync full schedule to calendar',
    syncHint: 'Paste this link into your calendar app\u2019s "subscribe by URL" option to keep it in sync automatically.',

    // roles
    participant: 'Participant',
    coach: 'Coach',
    assistantCoach: 'Assistant Coach',
    trainer: 'Trainer',
    scorekeeper: 'Score Keeper',
    referee: 'Referee',

    // attendance status
    goingShort: 'Going',
    maybe: 'Maybe',
    notGoingShort: 'Not going',
    unknownShort: 'Unknown',

    // attend page
    playersAttending: "Who's attending?",
    pickPlayer: 'Pick a player, then choose which events they\'ll be at.',
    player: 'Player',
    noPlayersYet: 'No players yet — add some in Admin first.',
    pickPlayerPrompt: 'Pick a player above to see events.',
    events: 'Events',
    confirmedCount: '{going} of {total} confirmed',
    addNote: 'Add a note (optional)',

    // overview page
    whosComing: "Who's coming?",
    overviewSubtitle: 'Overview of all events with attendance and staff assignments.',
    goingLabel: 'Going ({count}):',
    maybeLabel: 'Maybe ({count}):',
    notGoingLabel: 'Not going ({count}):',
    staffLabel: 'Staff:',

    // staff page
    staffAssignmentsTitle: 'Staff assignments',
    staffAssignmentsSubtitle: 'Assign staff members to events based on required roles.',
    noneAssigned: '— None —',
    noEligibleStaff: 'No staff members with this role available.',

    // admin page
    adminSubtitle: 'Manage persons, categories, and events.',
    persons: 'Persons',
    peopleHint: 'People with roles: participants, coaches, assistant coaches, or trainers.',
    namePlaceholder: 'Full name',
    rolesLabel: 'Roles',
    addPerson: 'Add person',
    categories: 'Categories',
    categoriesHint: 'Toggle which staff roles a category needs.',
    categoryNamePlaceholder: 'Category name',
    addCategory: 'Add category',
    newEvent: 'New event',
    editEvent: 'Edit event',
    cancelEdit: 'Cancel edit',
    startTime: 'Start time',
    endTime: 'End time',
    location: 'Location',
    locationPlaceholder: 'e.g. Sports hall, Main street 12',
    description: 'Description',
    descriptionPlaceholder: 'Optional details',
    saveEvent: 'Save event',
    eventsTotal: '{count} total',
    noEventsAdmin: 'No events yet — add one above.',
    noPersonsYet: 'No persons yet.',
    noCategoriesYet: 'No categories yet.',
    nameRequired: 'Name is required.',
    roleRequired: 'Select at least one role.',
    dateRequired: 'Date is required.',
    couldNotAddPerson: 'Could not add person.',
    couldNotSaveEvent: 'Could not save event.',
    confirmRemoveAllRoles: 'Removing all roles will delete this person. Continue?',
    confirmRemovePerson: 'Remove this person?',
    confirmRemoveCategory: 'Remove this category?',
    confirmDeleteEvent: 'Delete this event?',
  },
  'nl-BE': {
    // nav
    overview: 'Overzicht',
    attend: 'Aanwezigheid',
    staffNav: 'Staff',
    admin: 'Beheer',

    // common
    save: 'Opslaan',
    saved: 'Opgeslagen',
    added: 'Toegevoegd.',
    cancel: 'Annuleren',
    remove: 'Verwijderen',
    edit: 'Bewerken',
    delete: 'Verwijderen',
    close: 'Sluiten',
    retry: 'Opslaan mislukt — probeer opnieuw',
    noCategory: 'Geen categorie',
    uncategorized: 'Zonder categorie',
    all: 'Alle',
    copy: 'Kopiëren',
    copied: 'Gekopieerd!',
    download: 'Downloaden',
    selectAndCopy: 'Selecteren & kopiëren',
    noEventsYet: 'Nog geen events — voeg er eerst toe via Beheer.',
    staffNeeded: 'Staff nodig',

    // filters
    category: 'Categorie',
    date: 'Datum',
    upcoming: 'Komend',
    past: 'Voorbij',
    allDates: 'Alle data',
    noFilterMatch: 'Geen events komen overeen met de huidige filters.',

    // sync
    syncToCalendar: 'Synchroniseren met kalender',
    syncFullSchedule: 'Volledig schema synchroniseren met kalender',
    syncHint: 'Plak deze link bij "abonneren via URL" in je kalender-app om automatisch synchroon te blijven.',

    // roles
    participant: 'Deelnemer',
    coach: 'Coach',
    assistantCoach: 'Assistent-coach',
    trainer: 'Trainer',
    scorekeeper: 'Scoreteller',
    referee: 'Scheidsrechter',

    // attendance status
    goingShort: 'Aanwezig',
    maybe: 'Misschien',
    notGoingShort: 'Afwezig',
    unknownShort: 'Onbekend',

    // attend page
    playersAttending: 'Wie is er bij?',
    pickPlayer: 'Kies een speler en geef aan bij welke events die aanwezig zal zijn.',
    player: 'Speler',
    noPlayersYet: 'Nog geen spelers — voeg er eerst toe via Beheer.',
    pickPlayerPrompt: 'Kies hierboven een speler om de events te zien.',
    events: 'Events',
    confirmedCount: '{going} van {total} bevestigd',
    addNote: 'Voeg een notitie toe (optioneel)',

    // overview page
    whosComing: 'Wie is er bij?',
    overviewSubtitle: 'Overzicht van alle events met aanwezigheid en staff-toewijzingen.',
    goingLabel: 'Aanwezig ({count}):',
    maybeLabel: 'Misschien ({count}):',
    notGoingLabel: 'Afwezig ({count}):',
    staffLabel: 'Staff:',

    // staff page
    staffAssignmentsTitle: 'Staff-toewijzingen',
    staffAssignmentsSubtitle: 'Wijs staff toe aan events op basis van de vereiste rollen.',
    noneAssigned: '— Geen —',
    noEligibleStaff: 'Geen staff met deze rol beschikbaar.',

    // admin page
    adminSubtitle: 'Beheer personen, categorieën en events.',
    persons: 'Personen',
    peopleHint: 'Personen met rollen: deelnemer, coach, assistent-coach of trainer.',
    namePlaceholder: 'Volledige naam',
    rolesLabel: 'Rollen',
    addPerson: 'Persoon toevoegen',
    categories: 'Categorieën',
    categoriesHint: 'Kies welke staffrollen een categorie nodig heeft.',
    categoryNamePlaceholder: 'Naam categorie',
    addCategory: 'Categorie toevoegen',
    newEvent: 'Nieuw event',
    editEvent: 'Event bewerken',
    cancelEdit: 'Bewerken annuleren',
    startTime: 'Starttijd',
    endTime: 'Eindtijd',
    location: 'Locatie',
    locationPlaceholder: 'bv. Sporthal, Hoofdstraat 12',
    description: 'Beschrijving',
    descriptionPlaceholder: 'Optionele details',
    saveEvent: 'Event opslaan',
    eventsTotal: '{count} totaal',
    noEventsAdmin: 'Nog geen events — voeg er hierboven één toe.',
    noPersonsYet: 'Nog geen personen.',
    noCategoriesYet: 'Nog geen categorieën.',
    nameRequired: 'Naam is verplicht.',
    roleRequired: 'Kies minstens één rol.',
    dateRequired: 'Datum is verplicht.',
    couldNotAddPerson: 'Kon persoon niet toevoegen.',
    couldNotSaveEvent: 'Kon event niet opslaan.',
    confirmRemoveAllRoles: 'Als je alle rollen verwijdert, wordt deze persoon verwijderd. Doorgaan?',
    confirmRemovePerson: 'Deze persoon verwijderen?',
    confirmRemoveCategory: 'Deze categorie verwijderen?',
    confirmDeleteEvent: 'Dit event verwijderen?',
  }
};

const DEFAULT_FALLBACK_LANG = 'nl-BE';

// Pick the first browser-preferred language we have a translation for
// (checking exact match like "nl-BE" first, then base-language like "nl"
// or "en"). If none of the browser's preferred languages have a
// translation at all, fall back to nl-BE — not English — since that's
// this club's default audience.
function detectLanguage() {
  const available = Object.keys(MESSAGES);
  const prefs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
  for (const pref of prefs) {
    if (!pref) continue;
    const exact = available.find(a => a.toLowerCase() === pref.toLowerCase());
    if (exact) return exact;
  }
  for (const pref of prefs) {
    if (!pref) continue;
    const base = pref.toLowerCase().split('-')[0];
    const partial = available.find(a => a.toLowerCase().split('-')[0] === base);
    if (partial) return partial;
  }
  return DEFAULT_FALLBACK_LANG;
}

let currentLanguage = detectLanguage();

function t(key, vars) {
  const dict = MESSAGES[currentLanguage] || MESSAGES[DEFAULT_FALLBACK_LANG];
  let str = dict[key];
  if (str === undefined) str = (MESSAGES[DEFAULT_FALLBACK_LANG] || {})[key];
  if (str === undefined) str = key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return str;
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
  if (!cat) return `<span class="badge" style="background:#0000000f;color:var(--ink-soft)">${t('uncategorized')}</span>`;
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
  makeChip(null, opts.noneLabel || t('noCategory'), null);
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
      <button type="button" class="btn secondary">${t('copy')}</button>
      <a class="btn" href="${escapeHtml(url)}">${t('download')}</a>
    </div>
    <div class="subscribe-hint">${t('syncHint')}</div>
  `;
  const copyBtn = container.querySelector('.btn.secondary');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = t('copied');
    } catch (e) {
      container.querySelector('input').select();
      copyBtn.textContent = t('selectAndCopy');
    }
    setTimeout(() => { copyBtn.textContent = t('copy'); }, 1500);
  });
}

// Roles
const PARTICIPANT_ROLE = 'participant';
const STAFF_ROLES = [
  { id: 'coach', label: t('coach') },
  { id: 'assistant-coach', label: t('assistantCoach') },
  { id: 'trainer', label: t('trainer') },
  { id: 'scorekeeper', label: t('scorekeeper') },
  { id: 'referee', label: t('referee') }
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
  makeChip('__all__', t('all'), null, true);
  categories.forEach(c => makeChip(c.id, c.name, c.color, false));
  makeChip(null, t('uncategorized'), null, false);
}

function renderDateFilterChips(container, currentMode, onChange) {
  container.innerHTML = '';
  const options = [
    { mode: 'upcoming', label: t('upcoming') },
    { mode: 'past', label: t('past') },
    { mode: 'all', label: t('allDates') },
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
