const peopleApi = {
  load(slug) { return apiRequest(teamApiUrl("", slug)); },
  add(slug, name, roles) { return apiRequest(teamApiUrl("persons", slug), { method: "POST", body: JSON.stringify({ name, roles }) }); },
  updateRoles(slug, personId, roles) { return apiRequest(teamApiUrl(`members/${encodeURIComponent(personId)}/roles`, slug), { method: "PUT", body: JSON.stringify({ roles }) }); },
  remove(slug, personId) { return apiRequest(teamApiUrl(`members/${encodeURIComponent(personId)}`, slug), { method: "DELETE" }); },
};
