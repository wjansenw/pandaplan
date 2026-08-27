async function getTeamState(slug) {
  return apiRequest(teamApiUrl("state", slug));
}

async function updateAttendance(slug, personId, eventId, status, note) {
  return apiRequest(
    teamApiUrl("attendance", slug) +
      "/" +
      encodeURIComponent(personId) +
      "/" +
      encodeURIComponent(eventId),
    {
      method: "PUT",
      body: JSON.stringify({ status, note }),
    },
  );
}
