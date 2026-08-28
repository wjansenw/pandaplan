# OIDC integration steps 1-4

Implemented on `dev_oidc`:

1. Shared server-side OIDC session middleware.
2. Authentication required for PandaPlan pages, APIs, and calendar feeds.
3. Navigation derives admin visibility from the authenticated session; admin links are only emitted for a Site Admin.
4. Team API routes enforce the configured team permissions for reads and writes.

The existing page code still accepts the legacy `?mode=admin` UI flag for now. It is no longer an authorization mechanism: API authorization is enforced server-side. Removing that legacy UI flag completely is a later cleanup step.
