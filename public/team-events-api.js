const eventsApi = {
  async load(slug) {
    const base = "/api/teams/" + encodeURIComponent(slug);
    const [team, categories, events] = await Promise.all([
      api(base),
      api(base + "/categories"),
      api(base + "/events"),
    ]);
    return { team, categories, events };
  },
  list(slug) {
    return api("/api/teams/" + encodeURIComponent(slug) + "/events");
  },
  create(slug, event) {
    return api("/api/teams/" + encodeURIComponent(slug) + "/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
  update(slug, eventId, event) {
    return api(
      "/api/teams/" + encodeURIComponent(slug) + "/events/" + encodeURIComponent(eventId),
      { method: "PUT", body: JSON.stringify(event) },
    );
  },
  remove(slug, eventId) {
    return api(
      "/api/teams/" + encodeURIComponent(slug) + "/events/" + encodeURIComponent(eventId),
      { method: "DELETE" },
    );
  },
  createRecurring(slug, event) {
    return api(
      "/api/teams/" + encodeURIComponent(slug) + "/events/recurring",
      { method: "POST", body: JSON.stringify(event) },
    );
  },
  importIcs(slug, options) {
    return api(
      "/api/teams/" + encodeURIComponent(slug) + "/events/import-ics",
      { method: "POST", body: JSON.stringify(options) },
    );
  },
};
