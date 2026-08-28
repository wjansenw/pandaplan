# PandaPlan OIDC prototype

This directory contains the standalone OIDC authentication prototype. It is intentionally not integrated with the existing PandaPlan pages.

The prototype supports:

- OIDC Authorization Code login with PKCE (S256)
- authenticated-session confirmation
- local session logout
- OpenID Connect provider logout when the provider exposes a logout endpoint

The logout form uses `POST /oidc/logout`; `GET /oidc/logout` remains available for direct browser navigation.
