const categoriesApi = {
  load(slug) {
    return Promise.all([
      apiRequest(teamApiUrl("", slug)),
      apiRequest(teamApiUrl("categories", slug)),
    ]).then(([team, categories]) => ({ team, categories }));
  },
  add(slug, name) {
    return apiRequest(teamApiUrl("categories", slug), {
      method: "POST",
      body: JSON.stringify({ name, requiredStaffRoles: [] }),
    });
  },
  update(slug, id, category) {
    return apiRequest(
      teamApiUrl(`categories/${encodeURIComponent(id)}`, slug),
      { method: "PUT", body: JSON.stringify(category) },
    );
  },
  remove(slug, id) {
    return apiRequest(
      teamApiUrl(`categories/${encodeURIComponent(id)}`, slug),
      { method: "DELETE" },
    );
  },
};
