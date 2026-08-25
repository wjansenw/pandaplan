// Shared API infrastructure.
// Page-specific *-api.js modules should use apiRequest() for HTTP access.
async function apiRequest(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let message = "Request failed: " + path;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch (e) {
      // Keep the generic request error when the response is not JSON.
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}
