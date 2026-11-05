# Simba Stat data and API integration

## Source register (reviewed 5 November 2026)

- FECAFOOT is the primary source for competition calendars, qualified player lists, and official regulations. The 2026/27 Elite One and Elite Two calendars are published as PDFs on 13 October 2026.
- FECAFOOT's Elite Two page currently presents the competition in two groups, while the 2026/27 regulations/news describe a single 12-club group. Resolve this source conflict against the actual signed calendar and current federation notices before importing standings.
- Inside Cameroon Sport publishes 2026/27 Elite One match results and a live table; use it only as a secondary cross-check, with each result carrying a source URL and verification status.
- Eurosport has match listings/results for Elite One and is a secondary cross-check, not the source of truth for player identities or disciplinary decisions.

Do not silently fill missing scores, goalkeeper statistics, lineups, or player identities. Store unknown values as null and distinguish scheduled, played, postponed, and awaiting-confirmation matches.

## API shape

The app should consume normalized records, not scrape presentation markup:

- `competitions`: stable ID, slug, name, level, country, active flag
- `seasons`: ID, competition ID, label, start/end dates, status
- `clubs`: stable ID, competition-season membership, name, slug, crest URL
- `matches`: ID, season ID, round, kickoff, home/away club IDs, scores, status, venue
- `match_events`: match ID, minute, event type, player public ID, club ID, assist public ID
- `players`: public ID, display name, club-season membership; federation registration numbers stay server-side
- `sources`: record type/ID, source URL, checked time, confidence, editor note

Standings, best attack/defence, goal totals, and form should be derived from verified match records. Individual goalkeeper clean sheets require goalkeeper appearances or official keeper statistics; do not infer them from team shutouts.

## Suggested endpoints

- `GET /api/v1/competitions`
- `GET /api/v1/seasons/:seasonId/standings`
- `GET /api/v1/seasons/:seasonId/matches?round=&club=`
- `GET /api/v1/seasons/:seasonId/leaders?metric=goals|assists|keeper_clean_sheets`
- `GET /api/v1/seasons/elite-one-2026-27/lineups` returns confirmed match sheets with formation, starters, substitutes, source URL, verification time, and status. The club roster view uses published match lineups when available; it does not derive a starting XI from registered players.
- `GET /api/v1/seasons/elite-one-2026-27/club-directory` returns club leadership, technical staff, stadium details, and source/verification metadata. Unknown fields remain `null` and appear as “À confirmer” in the interface.
- `POST /api/v1/admin/imports` for authenticated data updates. Imports validate every match and source before writing, reject duplicate IDs and unsafe scores, and return `409` when a confirmed score changes. After checking the source, an administrator can explicitly approve the conflict with `reviewConflicts: true` and a `reviewNote`.
- `GET /api/v1/admin/imports` returns the latest 50 import revisions to an authenticated administrator. Each revision records the source, checksum, before/after values, review note, timestamp, and write status. Runtime history is stored in the ignored `data/import-audit.json` file.
- `POST /api/v1/admin/imports/:revisionId/rollback` restores an applied revision only when the affected match records have not changed since it was applied; a review note is required.

The current local data files are `data/elite-one-2026-27-lineups.json` and `data/club-directory-elite-one-2026-27.json`. Populate a field only after checking an attributable federation or club source; include `sourceUrl` and `verifiedAt` with each verified update. Do not infer home grounds, officials, staff, or lineups.

## Current local API

Run the Vite app from `V2`; its dev and preview servers mount the API handler in-process, so browser requests do not depend on a separate localhost port. `npm run api` remains available when the API needs to run as a standalone local service. The client reads Elite Two from `GET /api/v1/data/elite-two-2026-27`.

Optional accounts are supported by `POST /api/v1/account/register`, `POST /api/v1/account/login`, `GET /api/v1/account/me`, `PUT /api/v1/account/preferences`, and `POST /api/v1/account/logout`. Sessions use an HttpOnly, SameSite=Lax cookie; password hashes use Node scrypt. Account records are written to the ignored local file `data/accounts.json`.

This file-backed account store is for local development only. Before public launch, move users and sessions to a managed database, add email verification and password recovery, and configure a real push service with VAPID keys. The service worker can display push events, but push delivery is not configured yet. The preferences screen asks permission for browser notifications and stores followed clubs and competition interests, but it does not claim that live alerts are being sent until that delivery service is connected.

The manifest and service worker make the V2 site installable as a PWA. `localhost` is treated as a secure development origin by browsers. A deployed app must be served over HTTPS with a valid certificate from its hosting provider; do not install a self-signed certificate on visitors' phones.

On HTTPS, account cookies are marked Secure automatically when the TLS proxy sends `X-Forwarded-Proto: https`. Keep the proxy private to the app server and configure it to overwrite that header.

The Vite client may know only `VITE_API_BASE_URL`, which is public configuration. Any provider/internal API key belongs in a server-only environment variable such as `SIMBA_PROVIDER_API_KEY`; never prefix it with `VITE_`, include it in HTML, or send it to browsers. Admin writes should use separate authentication, not the provider key.

## Import and update lifecycle

1. Fetch from an approved source on the server.
2. Validate every match ID, club membership, duplicate, score range, and source URL before changing any result.
3. Save source URL, verification timestamp, and a SHA-256 checksum with the revision.
4. Conflicting confirmed scores return `409` and are not changed unless an administrator resubmits them with `reviewConflicts: true` and a review note.
5. Each accepted import stores before/after values and a pending/applied status in `data/import-audit.json`; use the authenticated rollback endpoint to restore a revision when the current records still match its saved after-values.
6. Standings and league totals are derived from `status: "played"` records only. Predictions and unconfirmed scores stay out of those calculations.

The current account store is still a local development store, and push delivery still needs a managed account database plus configured push credentials. Do not deploy account registration or promise off-device notifications until those services are configured.
