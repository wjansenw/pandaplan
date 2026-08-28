# OIDC integration status

The standalone OIDC flow is now connected to the PandaPlan application shell on `dev_oidc`.

- `/` requires authentication and redirects authenticated users to Teams.
- Team pages, Teams, About, protected APIs, and calendar feeds require an authenticated session.
- Team visibility is restricted by the authenticated account.
- The sidebar reads the authenticated account and provides logout.
- Site-admin authorization is enforced server-side.
- The existing page code still accepts the legacy `?mode=admin` UI flag in some controllers. It is no longer an authorization mechanism: API authorization is enforced server-side. Removing that legacy UI flag completely is a follow-up cleanup step once all page controllers consistently use the authenticated account.
