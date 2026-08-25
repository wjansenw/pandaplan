const teamsApi = {
  list() { return apiRequest("/api/teams"); },
  persons() { return apiRequest("/api/state").then((s) => s.persons || []); },
  detail(slug) { return apiRequest(teamApiUrl("", slug)); },
  create(data) { return apiRequest("/api/teams", { method: "POST", body: JSON.stringify(data) }); },
  update(slug, data) { return apiRequest(teamApiUrl("", slug), { method: "PUT", body: JSON.stringify(data) }); },
  remove(slug) { return apiRequest(teamApiUrl("", slug), { method: "DELETE" }); },
  addMember(slug, personId) { return apiRequest(teamApiUrl(`members/${encodeURIComponent(personId)}`, slug), { method: "POST" }); },
  removeMember(slug, personId) { return apiRequest(teamApiUrl(`members/${encodeURIComponent(personId)}`, slug), { method: "DELETE" }); },
  removeAttendance(slug) { return apiRequest(teamApiUrl("attendance", slug), { method: "DELETE" }); },
  removeEvents(slug) { return apiRequest(teamApiUrl("events", slug), { method: "DELETE" }); },
};
