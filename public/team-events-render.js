function eventForm(e) {
  return (
    '<div class="edit-form"><div class="field"><label>' +
    et("subject") +
    '</label><input class="edit-subject" value="' +
    escapeHtml(e.subject || "") +
    '"></div><div class="field"><label>' +
    t("category") +
    '</label><select class="edit-category">' +
    categoryOptions() +
    '</select></div><div class="field-row"><div class="field"><label>' +
    t("date") +
    '</label><input class="edit-date" type="date" value="' +
    escapeHtml(e.date || "") +
    '"></div><div class="field"><label>' +
    t("startTime") +
    '</label><input class="edit-start" type="time" value="' +
    escapeHtml(e.startTime || "") +
    '"></div><div class="field"><label>' +
    t("endTime") +
    '</label><input class="edit-end" type="time" value="' +
    escapeHtml(e.endTime || "") +
    '"></div></div><div class="field"><label>' +
    t("location") +
    '</label><input class="edit-location" value="' +
    escapeHtml(e.location || "") +
    '"></div><div class="field"><label>' +
    t("description") +
    '</label><textarea class="edit-description">' +
    escapeHtml(e.description || "") +
    '</textarea></div><button class="btn save-edit">' +
    t("save") +
    '</button> <button class="btn secondary cancel-edit">' +
    t("cancel") +
    '</button><span class="saved-note edit-note"></span></div>'
  );
}

function renderEvents() {
  const box = $("events");
  box.innerHTML = "";
  if (!pageState.events.length) {
    box.innerHTML =
      '<div class="card"><div class="empty">' +
      escapeHtml(et("noEvents")) +
      ".</div></div>";
    return;
  }
  pageState.events.forEach((e) => {
    const c = pageState.categories.find((x) => x.id === e.categoryId);
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.eventId = e.id;
    card.innerHTML =
      '<div class="card-head"><div><h2>' +
      escapeHtml(e.subject || et("untitledEvent")) +
      '</h2><div class="sub">' +
      escapeHtml(e.date) +
      (e.startTime ? " · " + escapeHtml(e.startTime) : "") +
      (e.endTime ? " – " + escapeHtml(e.endTime) : "") +
      (c ? " · " + escapeHtml(c.name) : "") +
      (e.location ? " · " + escapeHtml(e.location) : "") +
      '</div></div><div><button class="edit">' +
      t("edit") +
      '</button> <button class="del">' +
      t("delete") +
      "</button></div></div>" +
      (e.description ? "<p>" + escapeHtml(e.description) + "</p>" : "") +
      eventForm(e);
    const form = card.querySelector(".edit-form");
    form.hidden = true;
    form.querySelector(".edit-category").value = e.categoryId || "";
    box.appendChild(card);
  });
}
