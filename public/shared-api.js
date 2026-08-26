// Shared API infrastructure.
// Page-specific *-api.js modules should use apiRequest() for HTTP access.
async function apiRequest(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    const contentType = res.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const body = await res.json();
        if (body.error) message = body.error;
      } else {
        const body = (await res.text()).trim();
        if (body) message = body;
      }
    } catch (e) {
      // Keep the generic request error when the response body cannot be read.
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return res.json();
}
