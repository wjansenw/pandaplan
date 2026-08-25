// Internationalization
const MESSAGES = {
  en: {
    overview: "Overview",
    attend: "Attend",
    staffNav: "Staff",
    admin: "Admin",
    save: "Save",
    saved: "Saved",
    added: "Added.",
    cancel: "Cancel",
    remove: "Remove",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    retry: "Could not save — retry",
    noCategory: "No category",
    uncategorized: "Uncategorized",
    all: "All",
    copy: "Copy",
    copied: "Copied!",
    download: "Download",
    selectAndCopy: "Select & copy",
    noEventsYet: "No events yet — add some in Admin first.",
    staffNeeded: "Staff needed",
    from: "From",
    until: "Until",
    clickToExpand: "Click to expand",
    clickToCollapse: "Click to collapse",
    category: "Category",
    date: "Date",
    upcoming: "Upcoming",
    past: "Past",
    allDates: "All dates",
    noFilterMatch: "No events match the current filters.",
    syncToCalendar: "Sync to calendar",
    syncFullSchedule: "Sync full schedule to calendar",
    syncHint: 'Paste this link into your calendar app\u2019s "subscribe by URL" option to keep it in sync automatically.',
    participant: "Participant",
    coach: "Coach",
    assistantCoach: "Assistant Coach",
    trainer: "Trainer",
    scorekeeper: "Score Keeper",
    referee: "Referee",
    goingShort: "Going",
    maybe: "Maybe",
    notGoingShort: "Not going",
    unknownShort: "Unknown",
    playersAttending: "Who's attending?",
    pickPlayer: "Pick a player, then choose which events they'll be at.",
    player: "Player",
    noPlayersYet: "No players yet — add some in Admin first.",
    pickPlayerPrompt: "Pick a player above to see events.",
    events: "Events",
    confirmedCount: "{going} of {total} confirmed",
    addNote: "Add a note (optional)",
    whosComing: "Who's coming?",
    overviewSubtitle: "Overview of all events with attendance and staff assignments.",
    goingLabel: "Going ({count}):",
    maybeLabel: "Maybe ({count}):",
    notGoingLabel: "Not going ({count}):",
    staffLabel: "Staff:",
    staffAssignmentsTitle: "Staff assignments",
    staffAssignmentsSubtitle: "Assign staff members to events based on required roles.",
    noneAssigned: "— None —",
    noEligibleStaff: "No staff members with this role available.",
    adminSubtitle: "Manage persons, categories, and events.",
    persons: "Persons",
    peopleHint: "People with roles: participants, coaches, assistant coaches, or trainers.",
    namePlaceholder: "Full name",
    rolesLabel: "Roles",
    addPerson: "Add person",
    categories: "Categories",
    categoriesHint: "Toggle which staff roles a category needs.",
    categoryNamePlaceholder: "Category name",
    addCategory: "Add category",
    newEvent: "New event",
    editEvent: "Edit event",
    cancelEdit: "Cancel edit",
    startTime: "Start time",
    endTime: "End time",
    location: "Location",
    locationPlaceholder: "e.g. Sports hall, Main street 12",
    description: "Description",
    descriptionPlaceholder: "Optional details",
    saveEvent: "Save event",
    eventsTotal: "{count} total",
    noEventsAdmin: "No events yet — add one above.",
    noPersonsYet: "No persons yet.",
    noCategoriesYet: "No categories yet.",
    nameRequired: "Name is required.",
    roleRequired: "Select at least one role.",
    dateRequired: "Date is required.",
    couldNotAddPerson: "Could not add person.",
    couldNotSaveEvent: "Could not save event.",
    confirmRemoveAllRoles: "Removing all roles will delete this person. Continue?",
    confirmRemovePerson: "Remove this person?",
    confirmRemoveCategory: "Remove this category?",
    confirmDeleteEvent: "Delete this event?",
    bulkAttendance: "Bulk attendance",
    bulkAttendanceHint: "Set attendance for multiple events at once. Nothing changes until you choose an action and confirm it.",
    selectParticipant: "Select a participant…",
    allCategories: "All categories",
    fromDate: "From",
    toDate: "To",
    eventsSelected: "{count} event(s) selected",
    invalidDateRange: "The start date must not be after the end date.",
    anyDate: "Any date",
    thisParticipant: "this participant",
    confirmBulkAttendance: "Set {status} for {person}?\n\n{category} · {count} events\n{dates}\n\nThis will change attendance for all matching events.",
    eventsUpdated: "{count} event(s) updated",
    couldNotSaveAttendance: "Could not save attendance: {error}",
    tryAgain: "Please try again.",
    calendar: "Calendar",
    teamOverview: "Team overview",
    teamOverviewSubtitle: "Attendance and staff assignments for this Team.",
    editAttendance: "Edit attendance",
    doneAttendance: "Done attendance",
    editStaff: "Edit staff",
    doneStaff: "Done staff",
    subscribeTeamEvents: "Subscribe to this Team's events in your calendar app.",
    subscribePersonEvents: "Subscribe to a person's events",
    personCalendarHint: "Select a person to get a calendar containing events where that person is going or is assigned as staff.",
    selectPersonFirst: "Select a person first",
    noEventsForFilter: "No events match this filter.",
    editNote: "Edit note",
    addNoteTitle: "Add note",
    couldNotSaveNote: "Could not save note. Please try again.",
    couldNotUpdateAttendance: "Could not save attendance. Please try again.",
    staff: "Staff",
    unknown: "Unknown",
    peopleNav: "People",
    selectPersonOption: "Select a person…",
    name: "Name",
    peopleSubtitle: "People in this Team and their Team-specific roles.",
    confirmRemovePersonFromTeam: "Remove this person from the Team?",
    nameAndRoleRequired: "Name and at least one role are required.",
    categoriesSubtitle: "Categories and required staff roles for this Team.",
    couldNotSaveCategory: "Could not save category.",
    teams: "Teams",
    teamsSubtitle: "Manage Teams and cross-Team membership. Team-specific roles are managed inside each Team.",
    createTeam: "Create Team",
    slug: "Slug",
    create: "Create",
    openTeam: "Open",
    memberCount: "{count} members",
    saveTeam: "Save Team",
    deleteTeam: "Delete Team",
    addExistingPerson: "Add existing person",
    selectPerson: "Select person…",
    removeAllAttendance: "Remove all attendance",
    removeAllEvents: "Remove all events",
    deleteTeamConfirm: "Delete this Team and all its events? People who belong to no other Team will also be deleted.",
    removeAllAttendanceConfirm: "Remove all attendance records for this Team? This cannot be undone.",
    removeAllEventsConfirm: "Remove all events for this Team? This cannot be undone.",
    attendanceRemoved: "Attendance removed.",
    eventsRemoved: "Events removed.",
    noTeams: "No Teams yet.",
    created: "Created",
    teamSaveFailed: "Could not save Team. Please try again.",
    teamDeleteFailed: "Could not delete Team. Please try again.",
    teamDataActionFailed: "Could not complete this action. Please try again.",
    teamCreateFailed: "Could not create Team. Please try again.",
    about: "About",
  },
  "nl-BE": {
    overview: "Overzicht",
    attend: "Aanwezigheid",
    staffNav: "Staff",
    admin: "Beheer",
    save: "Opslaan",
    saved: "Opgeslagen",
    added: "Toegevoegd.",
    cancel: "Annuleren",
    remove: "Verwijderen",
    edit: "Bewerken",
    delete: "Verwijderen",
    close: "Sluiten",
    retry: "Opslaan mislukt — probeer opnieuw",
    noCategory: "Geen categorie",
    uncategorized: "Zonder categorie",
    all: "Alle",
    copy: "Kopiëren",
    copied: "Gekopieerd!",
    download: "Downloaden",
    selectAndCopy: "Selecteren & kopiëren",
    noEventsYet: "Nog geen events — voeg er eerst toe via Beheer.",
    staffNeeded: "Staff nodig",
    from: "Vanaf",
    until: "Tot",
    clickToExpand: "Klik om uit te vouwen",
    clickToCollapse: "Klik om in te klappen",
    category: "Categorie",
    date: "Datum",
    upcoming: "Komend",
    past: "Voorbij",
    allDates: "Alle data",
    noFilterMatch: "Geen events komen overeen met de huidige filters.",
    syncToCalendar: "Synchroniseren met kalender",
    syncFullSchedule: "Volledig schema synchroniseren met kalender",
    syncHint: 'Plak deze link bij "abonneren via URL" in je kalender-app om automatisch synchroon te blijven.',
    participant: "Deelnemer",
    coach: "Coach",
    assistantCoach: "Assistent-coach",
    trainer: "Trainer",
    scorekeeper: "Scoreteller",
    referee: "Scheidsrechter",
    goingShort: "Aanwezig",
    maybe: "Misschien",
    notGoingShort: "Afwezig",
    unknownShort: "Onbekend",
    playersAttending: "Wie is er bij?",
    pickPlayer: "Kies een speler en geef aan bij welke events die aanwezig zal zijn.",
    player: "Speler",
    noPlayersYet: "Nog geen spelers — voeg er eerst toe via Beheer.",
    pickPlayerPrompt: "Kies hierboven een speler om de events te zien.",
    events: "Events",
    confirmedCount: "{going} van {total} bevestigd",
    addNote: "Voeg een notitie toe (optioneel)",
    whosComing: "Wie is er bij?",
    overviewSubtitle: "Overzicht van alle events met aanwezigheid en staff-toewijzingen.",
    goingLabel: "Aanwezig ({count}):",
    maybeLabel: "Misschien ({count}):",
    notGoingLabel: "Afwezig ({count}):",
    staffLabel: "Staff:",
    staffAssignmentsTitle: "Staff-toewijzingen",
    staffAssignmentsSubtitle: "Wijs staff toe aan events op basis van de vereiste rollen.",
    noneAssigned: "— Geen —",
    noEligibleStaff: "Geen staff met deze rol beschikbaar.",
    adminSubtitle: "Beheer personen, categorieën en events.",
    persons: "Personen",
    peopleHint: "Personen met rollen: deelnemer, coach, assistent-coach of trainer.",
    namePlaceholder: "Volledige naam",
    rolesLabel: "Rollen",
    addPerson: "Persoon toevoegen",
    categories: "Categorieën",
    categoriesHint: "Kies welke staffrollen een categorie nodig heeft.",
    categoryNamePlaceholder: "Naam categorie",
    addCategory: "Categorie toevoegen",
    newEvent: "Nieuw event",
    editEvent: "Event bewerken",
    cancelEdit: "Bewerken annuleren",
    startTime: "Starttijd",
    endTime: "Eindtijd",
    location: "Locatie",
    locationPlaceholder: "bv. Sporthal, Hoofdstraat 12",
    description: "Beschrijving",
    descriptionPlaceholder: "Optionele details",
    saveEvent: "Event opslaan",
    eventsTotal: "{count} totaal",
    noEventsAdmin: "Nog geen events — voeg er hierboven één toe.",
    noPersonsYet: "Nog geen personen.",
    noCategoriesYet: "Nog geen categorieën.",
    nameRequired: "Naam is verplicht.",
    roleRequired: "Kies minstens één rol.",
    dateRequired: "Datum is verplicht.",
    couldNotAddPerson: "Kon persoon niet toevoegen.",
    couldNotSaveEvent: "Kon event niet opslaan.",
    confirmRemoveAllRoles: "Als je alle rollen verwijdert, wordt deze persoon verwijderd. Doorgaan?",
    confirmRemovePerson: "Deze persoon verwijderen?",
    confirmRemoveCategory: "Deze categorie verwijderen?",
    confirmDeleteEvent: "Dit event verwijderen?",
    bulkAttendance: "Bulk aanwezigheid",
    bulkAttendanceHint: "Stel de aanwezigheid voor meerdere events tegelijk in. Er verandert niets totdat je een actie kiest en bevestigt.",
    selectParticipant: "Selecteer een deelnemer…",
    allCategories: "Alle categorieën",
    fromDate: "Vanaf",
    toDate: "Tot",
    eventsSelected: "{count} event(s) geselecteerd",
    invalidDateRange: "De startdatum mag niet na de einddatum liggen.",
    anyDate: "Elke datum",
    thisParticipant: "deze deelnemer",
    confirmBulkAttendance: "Zet {status} voor {person}?\n\n{category} · {count} events\n{dates}\n\nDit wijzigt de aanwezigheid voor alle overeenkomende events.",
    eventsUpdated: "{count} event(s) bijgewerkt",
    couldNotSaveAttendance: "Aanwezigheid kon niet worden opgeslagen: {error}",
    tryAgain: "Probeer het opnieuw.",
    calendar: "Kalender",
    teamOverview: "Teamoverzicht",
    teamOverviewSubtitle: "Aanwezigheid en staff-toewijzingen voor dit team.",
    editAttendance: "Aanwezigheid bewerken",
    doneAttendance: "Aanwezigheid klaar",
    editStaff: "Staff bewerken",
    doneStaff: "Staff klaar",
    subscribeTeamEvents: "Abonneer je op de events van dit team in je kalender-app.",
    subscribePersonEvents: "Abonneren op de events van een persoon",
    personCalendarHint: "Selecteer een persoon om een kalender te krijgen met events waarvoor die persoon aanwezig is of als staff is toegewezen.",
    selectPersonFirst: "Selecteer eerst een persoon",
    noEventsForFilter: "Geen events komen overeen met dit filter.",
    editNote: "Notitie bewerken",
    addNoteTitle: "Notitie toevoegen",
    couldNotSaveNote: "Notitie kon niet worden opgeslagen. Probeer het opnieuw.",
    couldNotUpdateAttendance: "Aanwezigheid kon niet worden opgeslagen. Probeer het opnieuw.",
    staff: "Staff",
    unknown: "Onbekend",
    peopleNav: "Personen",
    selectPersonOption: "Selecteer een persoon…",
    name: "Naam",
    peopleSubtitle: "Personen in dit team en hun teamspecifieke rollen.",
    confirmRemovePersonFromTeam: "Deze persoon uit het team verwijderen?",
    nameAndRoleRequired: "Naam en minstens één rol zijn verplicht.",
    categoriesSubtitle: "Categorieën en vereiste staffrollen voor dit team.",
    couldNotSaveCategory: "Kon categorie niet opslaan.",
    teams: "Teams",
    teamsSubtitle: "Beheer teams en teamoverstijgend lidmaatschap. Teamspecifieke rollen worden binnen elk team beheerd.",
    createTeam: "Team aanmaken",
    slug: "Slug",
    create: "Aanmaken",
    openTeam: "Openen",
    memberCount: "{count} leden",
    saveTeam: "Team opslaan",
    deleteTeam: "Team verwijderen",
    addExistingPerson: "Bestaande persoon toevoegen",
    selectPerson: "Selecteer persoon…",
    removeAllAttendance: "Alle aanwezigheid verwijderen",
    removeAllEvents: "Alle events verwijderen",
    deleteTeamConfirm: "Dit team en al zijn events verwijderen? Personen die tot geen enkel ander team behoren worden ook verwijderd.",
    removeAllAttendanceConfirm: "Alle aanwezigheidsgegevens voor dit team verwijderen? Dit kan niet ongedaan worden gemaakt.",
    removeAllEventsConfirm: "Alle events voor dit team verwijderen? Dit kan niet ongedaan worden gemaakt.",
    attendanceRemoved: "Aanwezigheid verwijderd.",
    eventsRemoved: "Events verwijderd.",
    noTeams: "Nog geen teams.",
    created: "Aangemaakt",
    teamSaveFailed: "Kon team niet opslaan. Probeer het opnieuw.",
    teamDeleteFailed: "Kon team niet verwijderen. Probeer het opnieuw.",
    teamDataActionFailed: "Kon deze actie niet voltooien. Probeer het opnieuw.",
    teamCreateFailed: "Kon team niet aanmaken. Probeer het opnieuw.",
    about: "Over",
  },
};

const DEFAULT_FALLBACK_LANG = "nl-BE";
function detectLanguage() {
  const available = Object.keys(MESSAGES);
  const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (const pref of prefs) {
    if (!pref) continue;
    const lower = pref.toLowerCase();
    const exact = available.find((a) => a.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split("-")[0];
    const partial = available.find((a) => a.toLowerCase().split("-")[0] === base);
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
  if (vars) Object.keys(vars).forEach((k) => { str = str.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]); });
  return str;
}
async function api(path, opts) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) {
    let msg = "Request failed: " + path;
    try { const body = await res.json(); if (body.error) msg = body.error; } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}
function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(currentLanguage === "nl-BE" ? "nl-BE" : undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}
function formatTimeRange(startTime, endTime) {
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  if (startTime) return `${t("from")} ${startTime}`;
  if (endTime) return `${t("until")} ${endTime}`;
  return "";
}
function categoryById(categories, id) { return categories.find((c) => c.id === id) || null; }
function categoryBadge(categories, categoryId) {
  const cat = categoryById(categories, categoryId);
  if (!cat) return `<span class="badge" style="background:#0000000f;color:var(--ink-soft)">${t("uncategorized")}</span>`;
  return `<span class="badge" style="background:${cat.color}22;color:${cat.color}"><span class="badge-dot" style="background:${cat.color}"></span>${escapeHtml(cat.name)}</span>`;
}
function renderCategoryChips(container, categories, selectedId, onSelect, opts) {
  opts = opts || {};
  container.innerHTML = "";
  function makeChip(id, name, color) {
    const chip = document.createElement("button"); chip.type = "button"; chip.className = "chip"; chip.textContent = name;
    if (id === selectedId) { chip.classList.add("active"); if (color) { chip.style.background = color + "22"; chip.style.borderColor = color; chip.style.color = color; } }
    chip.addEventListener("click", () => onSelect(id)); container.appendChild(chip);
  }
  makeChip(null, opts.noneLabel || t("noCategory"), null); categories.forEach((c) => makeChip(c.id, c.name, c.color));
}
function sortByDateTime(events) { return events.slice().sort((a, b) => { const da = a.date + "T" + (a.startTime || "00:00"); const db = b.date + "T" + (b.startTime || "00:00"); return da.localeCompare(db); }); }
function renderSubscribeBox(container, url, label) {
  container.innerHTML = `<h3>${escapeHtml(label)}</h3><div class="subscribe-row"><input type="text" readonly value="${escapeHtml(url)}" onclick="this.select()"><button type="button" class="btn secondary">${t("copy")}</button><a class="btn" href="${escapeHtml(url)}">${t("download")}</a></div><div class="subscribe-hint">${t("syncHint")}</div>`;
  const copyBtn = container.querySelector(".btn.secondary");
  copyBtn.addEventListener("click", async () => { try { await navigator.clipboard.writeText(url); copyBtn.textContent = t("copied"); } catch (e) { container.querySelector("input").select(); copyBtn.textContent = t("selectAndCopy"); } setTimeout(() => { copyBtn.textContent = t("copy"); }, 1500); });
}
const PARTICIPANT_ROLE = "participant";
const STAFF_ROLES = [
  { id: "coach", label: t("coach") },
  { id: "assistant-coach", label: t("assistantCoach") },
  { id: "trainer", label: t("trainer") },
  { id: "scorekeeper", label: t("scorekeeper") },
  { id: "referee", label: t("referee") },
];
const ALL_ROLES = [{ id: PARTICIPANT_ROLE, label: t("participant") }, ...STAFF_ROLES];
function roleLabel(id) { const r = ALL_ROLES.find((x) => x.id === id); return r ? r.label : id; }
function personHasRole(person, roleId) { return Array.isArray(person.roles) && person.roles.includes(roleId); }
function staffRoleLabels(ids) { return STAFF_ROLES.filter((r) => (ids || []).includes(r.id)).map((r) => r.label); }
function renderMultiSelectChips(container, options, selectedSet, onToggle) {
  container.innerHTML = "";
  options.forEach((opt) => { const chip = document.createElement("button"); chip.type = "button"; chip.className = "chip" + (selectedSet.has(opt.id) ? " active" : ""); chip.textContent = opt.label; chip.addEventListener("click", () => { if (selectedSet.has(opt.id)) selectedSet.delete(opt.id); else selectedSet.add(opt.id); onToggle(); }); container.appendChild(chip); });
}
function todayIso() { const d = new Date(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0"); return `${d.getFullYear()}-${m}-${day}`; }
function filterEvents(events, filters) {
  const today = todayIso();
  return events.filter((ev) => { if (filters.categoryIds && filters.categoryIds.size && !filters.categoryIds.has(ev.categoryId)) return false; if (filters.dateMode === "upcoming" && ev.date < today) return false; if (filters.dateMode === "past" && ev.date >= today) return false; return true; });
}
function renderCategoryFilterChips(container, categories, selectedIds, onChange) {
  container.innerHTML = "";
  function makeChip(id, name, color, isAll) {
    const chip = document.createElement("button"); chip.type = "button"; chip.className = "chip"; chip.textContent = name;
    const isActive = isAll ? selectedIds.size === 0 : selectedIds.has(id);
    if (isActive) { chip.classList.add("active"); if (color) { chip.style.background = color + "22"; chip.style.borderColor = color; chip.style.color = color; } }
    chip.addEventListener("click", () => { if (isAll) selectedIds.clear(); else if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id); onChange(); }); container.appendChild(chip);
  }
  makeChip("__all__", t("all"), null, true); categories.forEach((c) => makeChip(c.id, c.name, c.color, false)); makeChip(null, t("uncategorized"), null, false);
}
function renderDateFilterChips(container, currentMode, onChange) {
  container.innerHTML = "";
  const options = [{ mode: "upcoming", label: t("upcoming") }, { mode: "past", label: t("past") }, { mode: "all", label: t("allDates") }];
  options.forEach((opt) => { const chip = document.createElement("button"); chip.type = "button"; chip.className = "chip" + (opt.mode === currentMode ? " active" : ""); chip.textContent = opt.label; chip.addEventListener("click", () => onChange(opt.mode)); container.appendChild(chip); });
}
function formatMapsLink(location) { if (!location) return ""; const encoded = encodeURIComponent(location); return `https://www.google.com/maps/search/${encoded}`; }

// Load the shared hierarchical navigation on every page.
(() => {
  const loadNavigation = () => {
    if (!document.querySelector('link[data-navigation-css]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/navigation.css";
      css.dataset.navigationCss = "true";
      document.head.appendChild(css);
    }
    if (!document.querySelector(".sidebar-open")) {
      const open = document.createElement("button");
      open.type = "button";
      open.className = "sidebar-open";
      open.setAttribute("aria-label", "Open navigation");
      open.textContent = "☰";
      document.body.appendChild(open);
    }
    if (!document.querySelector(".sidebar-backdrop")) {
      const backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "sidebar-backdrop";
      backdrop.hidden = true;
      backdrop.setAttribute("aria-label", "Close navigation");
      document.body.appendChild(backdrop);
    }
    if (!document.querySelector('script[data-navigation-js]')) {
      const script = document.createElement("script");
      script.src = "/navigation.js";
      script.dataset.navigationJs = "true";
      document.body.appendChild(script);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadNavigation, { once: true });
  else loadNavigation();
})();
