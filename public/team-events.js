const slug = decodeURIComponent(location.pathname.split("/")[2] || "");

const pageState = {
  team: null,
  categories: [],
  events: [],
  adminMode: new URLSearchParams(location.search).get("mode") === "admin",
};

const $ = (id) => document.getElementById(id);
const apiBase = () => "/api/teams/" + encodeURIComponent(slug);

const PAGE_MESSAGES = {
  en: {
    subject: "Subject",
    events: "Events",
    persons: "People",
    categories: "Categories",
    newEvent: "New event",
    recurringEvents: "Recurring events",
    recurringHelp:
      "Create multiple normal events on selected weekdays within a date range.",
    startDate: "Start date",
    endDate: "End date",
    weekdays: "Days",
    createRecurring: "Create events",
    recurringPreview: "{count} events will be created.",
    recurringCreated: "{count} events created.",
    selectWeekday: "Select at least one day.",
    dateRangeRequired: "Start and end dates are required.",
    invalidDateRange: "Start date must be before or equal to end date.",
    importFromIcs: "Import from ICS feed",
    icsImportHelp:
      "Enter a calendar feed URL. Events already matching all four fields are skipped.",
    icsFeedUrl: "ICS feed URL",
    icsFeedUrlPlaceholder: "https://example.com/calendar.ics",
    locationContains: "Location contains",
    locationContainsPlaceholder: "e.g. Sporthal",
    categoryWhenLocationMatches: "Category when location matches",
    categoryOtherwise: "Category otherwise",
    importEvents: "Import events",
    locationPlaceholder: "e.g. Sports hall, Main street 12",
    descriptionPlaceholder: "Optional details",
    teamNotFound: "Team not found",
    untitledEvent: "Untitled event",
    noEvents: "No events yet",
    subjectAndDateRequired: "Subject and date are required.",
    deleteEventConfirm: "Delete this event?",
    dateRequired: "Date is required.",
    subjectRequired: "Subject is required.",
    icsUrlRequired: "ICS feed URL is required.",
    importing: "Importing…",
    icsImportResult:
      "Found {found} events: {created} created, {skipped} already existed.",
  },
  "nl-BE": {
    subject: "Onderwerp",
    events: "Events",
    persons: "Personen",
    categories: "Categorieën",
    newEvent: "Nieuw event",
    recurringEvents: "Terugkerende events",
    recurringHelp:
      "Maak meerdere gewone events aan op geselecteerde weekdagen binnen een periode.",
    startDate: "Startdatum",
    endDate: "Einddatum",
    weekdays: "Dagen",
    createRecurring: "Events aanmaken",
    recurringPreview: "{count} events worden aangemaakt.",
    recurringCreated: "{count} events aangemaakt.",
    selectWeekday: "Selecteer minstens één dag.",
    dateRangeRequired: "Start- en einddatum zijn verplicht.",
    invalidDateRange: "Startdatum moet vóór of gelijk aan de einddatum zijn.",
    importFromIcs: "Importeren vanuit ICS-feed",
    icsImportHelp:
      "Geef een URL naar een kalenderfeed. Events die al overeenkomen met alle vier de velden worden overgeslagen.",
    icsFeedUrl: "ICS-feed URL",
    icsFeedUrlPlaceholder: "https://voorbeeld.be/kalender.ics",
    locationContains: "Locatie bevat",
    locationContainsPlaceholder: "bv. Sporthal",
    categoryWhenLocationMatches: "Categorie wanneer locatie overeenkomt",
    categoryOtherwise: "Categorie anders",
    importEvents: "Events importeren",
    locationPlaceholder: "bv. Sporthal, Hoofdstraat 12",
    descriptionPlaceholder: "Optionele details",
    teamNotFound: "Team niet gevonden",
    untitledEvent: "Event zonder naam",
    noEvents: "Nog geen events",
    subjectAndDateRequired: "Onderwerp en datum zijn verplicht.",
    deleteEventConfirm: "Dit event verwijderen?",
    dateRequired: "Datum is verplicht.",
    subjectRequired: "Onderwerp is verplicht.",
    icsUrlRequired: "ICS-feed URL is verplicht.",
    importing: "Bezig met importeren…",
    icsImportResult:
      "{found} events gevonden: {created} toegevoegd, {skipped} bestonden al.",
  },
};

function et(key, vars) {
  let s =
    (PAGE_MESSAGES[currentLanguage] || PAGE_MESSAGES["nl-BE"])[key] || t(key);
  if (vars)
    Object.keys(vars).forEach(
      (k) => (s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k])),
    );
  return s;
}
function modeUrl(url) {
  return pageState.adminMode
    ? url + (url.includes("?") ? "&" : "?") + "mode=admin"
    : url;
}
function applyTranslations() {
  document.documentElement.lang = currentLanguage === "nl-BE" ? "nl" : "en";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = et(el.dataset.i18n)));
  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach((el) => (el.placeholder = et(el.dataset.i18nPlaceholder)));
}
function categoryOptions() {
  return (
    '<option value="">' +
    escapeHtml(t("noCategory")) +
    "</option>" +
    pageState.categories
      .map(
        (c) =>
          '<option value="' +
          escapeHtml(c.id) +
          '">' +
          escapeHtml(c.name) +
          "</option>",
      )
      .join("")
  );
}
function weekdayOptions() {
  const names =
    currentLanguage === "nl-BE"
      ? [
          "Zondag",
          "Maandag",
          "Dinsdag",
          "Woensdag",
          "Donderdag",
          "Vrijdag",
          "Zaterdag",
        ]
      : [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
  return names
    .map(
      (name, i) =>
        '<label><input type="checkbox" value="' +
        i +
        '"> ' +
        escapeHtml(name) +
        "</label>",
    )
    .join("");
}
function updateRecurringPreview() {
  const start = $("recStartDate").value,
    end = $("recEndDate").value;
  const days = [...document.querySelectorAll("#recWeekdays input:checked")].map(
    (x) => Number(x.value),
  );
  if (!start || !end || start > end || !days.length) {
    $("recPreview").textContent = "";
    return;
  }
  let count = 0;
  for (
    let d = new Date(start + "T00:00:00Z");
    d <= new Date(end + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1)
  )
    if (days.includes(d.getUTCDay())) count++;
  $("recPreview").textContent = et("recurringPreview", { count });
}
async function reloadEvents() {
  pageState.events = await eventsApi.list(slug);
  renderEvents();
}
function bindFormHandlers() {
  $("save").onclick = createEvent;
  ["recStartDate", "recEndDate"].forEach((id) =>
    $(id).addEventListener("change", updateRecurringPreview),
  );
  $("recWeekdays").addEventListener("change", updateRecurringPreview);
  $("createRecurring").onclick = createRecurringEvents;
  $("importIcs").onclick = importIcs;
}
function handleEventClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  const card = target.closest("[data-event-id]");
  if (!card) return;
  const eventId = card.dataset.eventId;
  const item = pageState.events.find((e) => e.id === eventId);
  if (!item) return;
  const form = card.querySelector(".edit-form");
  if (target.matches(".edit")) {
    form.hidden = false;
    target.hidden = true;
  } else if (target.matches(".cancel-edit")) {
    form.hidden = true;
    card.querySelector(".edit").hidden = false;
  } else if (target.matches(".save-edit")) saveEventEdit(item, form);
  else if (target.matches(".del")) deleteEvent(item);
}
function bindEventHandlers() {
  $("events").onclick = handleEventClick;
}
async function createEvent() {
  try {
    const date = $("date").value;
    if (!date) {
      $("note").textContent = et("dateRequired");
      return;
    }
    const subject = $("subject").value.trim();
    if (!subject) {
      $("note").textContent = et("subjectRequired");
      return;
    }
    await eventsApi.create(slug, {
      subject,
      categoryId: $("category").value || null,
      date,
      startTime: $("start").value,
      endTime: $("end").value,
      location: $("location").value,
      description: $("description").value,
    });
    ["subject", "date", "start", "end", "location", "description"].forEach(
      (id) => ($(id).value = ""),
    );
    $("note").textContent = t("added");
    await reloadEvents();
  } catch (e) {
    $("note").textContent = e.message;
  }
}
async function saveEventEdit(item, form) {
  try {
    const subject = form.querySelector(".edit-subject").value.trim(),
      date = form.querySelector(".edit-date").value;
    if (!subject || !date) {
      form.querySelector(".edit-note").textContent = et(
        "subjectAndDateRequired",
      );
      return;
    }
    await eventsApi.update(slug, item.id, {
      subject,
      categoryId: form.querySelector(".edit-category").value || null,
      date,
      startTime: form.querySelector(".edit-start").value,
      endTime: form.querySelector(".edit-end").value,
      location: form.querySelector(".edit-location").value,
      description: form.querySelector(".edit-description").value,
    });
    await reloadEvents();
  } catch (err) {
    form.querySelector(".edit-note").textContent = err.message;
  }
}
async function deleteEvent(item) {
  if (!confirm(et("deleteEventConfirm"))) return;
  try {
    await eventsApi.remove(slug, item.id);
    await reloadEvents();
  } catch (err) {
    console.error(err);
  }
}
async function createRecurringEvents() {
  const subject = $("recSubject").value.trim(),
    startDate = $("recStartDate").value,
    endDate = $("recEndDate").value;
  const weekdays = [
    ...document.querySelectorAll("#recWeekdays input:checked"),
  ].map((x) => Number(x.value));
  if (!subject) {
    $("recNote").textContent = et("subjectRequired");
    return;
  }
  if (!startDate || !endDate) {
    $("recNote").textContent = et("dateRangeRequired");
    return;
  }
  if (startDate > endDate) {
    $("recNote").textContent = et("invalidDateRange");
    return;
  }
  if (!weekdays.length) {
    $("recNote").textContent = et("selectWeekday");
    return;
  }
  const button = $("createRecurring");
  button.disabled = true;
  try {
    const result = await eventsApi.createRecurring(slug, {
      subject,
      categoryId: $("recCategory").value || null,
      startDate,
      endDate,
      weekdays,
      startTime: $("recStart").value,
      endTime: $("recEnd").value,
      location: $("recLocation").value,
      description: $("recDescription").value,
    });
    $("recNote").textContent = et("recurringCreated", {
      count: result.created,
    });
    pageState.events = result.events;
    renderEvents();
  } catch (e) {
    $("recNote").textContent = e.message;
  } finally {
    button.disabled = false;
  }
}
async function importIcs() {
  const url = $("icsUrl").value.trim();
  if (!url) {
    $("importNote").textContent = et("icsUrlRequired");
    return;
  }
  const button = $("importIcs");
  button.disabled = true;
  $("importNote").textContent = et("importing");
  try {
    const result = await eventsApi.importIcs(slug, {
      url,
      locationContains: $("icsLocationContains").value,
      locationCategoryId: $("icsLocationCategory").value || null,
      fallbackCategoryId: $("icsFallbackCategory").value || null,
    });
    pageState.events = result.events;
    $("importNote").textContent = et("icsImportResult", {
      found: result.found,
      created: result.created,
      skipped: result.skipped,
    });
    renderEvents();
  } catch (e) {
    $("importNote").textContent = e.message;
  } finally {
    button.disabled = false;
  }
}
async function load() {
  try {
    const data = await eventsApi.load(slug);
    pageState.team = data.team;
    pageState.categories = data.categories;
    pageState.events = data.events;
    applyTranslations();
    document.title =
      "pandaplan · " + pageState.team.name + " · " + et("events");
    $("title").textContent = pageState.team.name + " · " + et("events");
    $("subtitle").textContent = pageState.team.description || "";
    const base = "/team/" + encodeURIComponent(pageState.team.slug);
    $("brand").href = modeUrl(base + "/overview");
    $("overviewLink").href = modeUrl(base + "/overview");
    $("peopleLink").href = modeUrl(base + "/people");
    $("categoriesLink").href = modeUrl(base + "/categories");
    document
      .querySelectorAll("[data-admin-only]")
      .forEach((el) => (el.hidden = !pageState.adminMode));
    const options = categoryOptions();
    $("category").innerHTML = options;
    $("recCategory").innerHTML = options;
    $("icsLocationCategory").innerHTML = options;
    $("icsFallbackCategory").innerHTML = options;
    $("recWeekdays").innerHTML = weekdayOptions();
    bindFormHandlers();
    bindEventHandlers();
    renderEvents();
  } catch (e) {
    document.body.innerHTML =
      '<div class="wrap"><div class="card"><h1>' +
      escapeHtml(et("teamNotFound")) +
      "</h1><p>" +
      escapeHtml(e.message) +
      "</p></div></div>";
  }
}
load();
