const eventsApi = {
  async load(slug) {
    const base = teamApiUrl("", slug);
    const [team, categories, events] = await Promise.all([
      apiRequest(base),
      apiRequest(base + "/categories"),
      apiRequest(base + "/events"),
    ]);
    return { team, categories, events };
  },
  list(slug) {
    return apiRequest(teamApiUrl("events", slug));
  },
  create(slug, event) {
    return apiRequest(teamApiUrl("events", slug), {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
  update(slug, eventId, event) {
    return apiRequest(
      teamApiUrl("events", slug) + "/" + encodeURIComponent(eventId),
      {
        method: "PUT",
        body: JSON.stringify(event),
      },
    );
  },
  remove(slug, eventId) {
    return apiRequest(
      teamApiUrl("events", slug) + "/" + encodeURIComponent(eventId),
      {
        method: "DELETE",
      },
    );
  },
  createRecurring(slug, event) {
    return apiRequest(teamApiUrl("events/recurring", slug), {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
  importIcs(slug, options) {
    return apiRequest(teamApiUrl("events/import-ics", slug), {
      method: "POST",
      body: JSON.stringify(options),
    });
  },
};
