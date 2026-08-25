async function getTeamState(slug) {
  return api("/api/teams/" + encodeURIComponent(slug) + "/state");
}

async function updateAttendance(slug, personId, eventId, status, note) {
  return api(
    "/api/teams/" +
      encodeURIComponent(slug) +
      "/attendance/" +
      encodeURIComponent(personId) +
      "/" +
      encodeURIComponent(eventId),
    {
      method: "PUT",
      body: JSON.stringify({ status, note }),
    },
  );
}
