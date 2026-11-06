# Simba Stat

Simba Stat follows Cameroon’s MTN Elite One and MTN Elite Two. The interface is a small vanilla JavaScript app served by Vite; the local Node API provides competition data, account endpoints, club directories, and controlled result imports.

## Requirements

- Node.js 22.12 or newer (or Node.js 20.19 or newer)
- npm

## Start locally

```sh
npm ci
npm run dev
```

Open the address printed by Vite (the default port is `8443`). The API is mounted in the Vite process, so a separate API server is not needed during development.

Create a local `.env` from `.env.example` only when testing administrative imports. Keep real keys out of the browser and out of version control.

## Build and preview

```sh
npm run build
npm run preview
```

The build emits the app, club crests, PWA files, and a Netlify-style `_headers` file. Other hosts must apply the same security headers in their own configuration. `npm run api` starts the API separately for local integration work.

## Data and coverage

- Elite One match results and standings are maintained in the app’s season data. Match sheets are shown as compositions only when an attributable, verified source is available. Visual previews are marked as illustrative.
- The FECAFOOT qualified-player/officer list is not a match sheet: it does not confirm starting elevens, shirt numbers, or tactical positions.
- Club leadership, staff roles, and home grounds remain “À confirmer” until a club or federation source supports each field.
- Elite Two totals and standings use confirmed scores only. Awaiting-confirmation results and projections do not affect them.
- Source links and collection dates are recorded in the data files and [API notes](api/README.md).

## API and account status

The public browser uses same-origin `/api/v1` routes. `SIMBA_ADMIN_API_KEY` and any future provider key are server-only. Administrative score imports validate the whole request, require a source URL, reject conflicting confirmed scores unless explicitly reviewed, and keep a revision history with a guarded rollback route.

Accounts currently use an ignored local JSON file and are for development only. They are not multi-instance storage. Push notifications are not delivered yet; production use requires a managed account store and configured push credentials. Do not present either capability as production-ready until those services are connected.

## Privacy

The app no longer loads fonts from Google Fonts. It uses the system font stack by default. Review any future analytics or third-party scripts before adding them to the content security policy.
