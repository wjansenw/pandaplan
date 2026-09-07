const peopleApi = {
  load(slug) {
    return apiRequest(teamApiUrl("persons", slug));
  },
  available(slug) {
    return apiRequest(teamApiUrl("persons/available", slug));
  },
  add(slug, name, roles) {
    return apiRequest(teamApiUrl("persons", slug), {
      method: "POST",
      body: JSON.stringify({ name, roles }),
    });
  },
  addExisting(slug, personId, roles) {
    return apiRequest(teamApiUrl(`persons/${encodeURIComponent(personId)}`, slug), {
      method: "POST",
      body: JSON.stringify({ roles }),
    });
  },
  updateRoles(slug, personId, roles) {
    return apiRequest(
      teamApiUrl(`persons/${encodeURIComponent(personId)}/roles`, slug),
      { method: "PUT", body: JSON.stringify({ roles }) },
    );
  },
  remove(slug, personId) {
    return apiRequest(
      teamApiUrl(`persons/${encodeURIComponent(personId)}`, slug),
      { method: "DELETE" },
    );
  },
};
