# Wellness Tracker frontend

An independent React + Vite application for the Wellness Tracker. It implements sign-in, registration, Today, historical editing, Calendar, Insights, Leaderboard, Profile, habit management, and administrator point rules.

## Start

Use Node 24, then:

```sh
npm ci
npm run dev:demo
```

Open `http://127.0.0.1:5173` and choose a sample account to fill the form, then press **Sign in**. Sample accounts use `alex@example.com` and `admin@example.com`, with password `wellness123`. Registration opens an empty sample workspace. Demo data persists in local browser storage; the demo session belongs to the current tab.

For the real backend, use `npm run dev`. Real API mode is the default. Copy `.env.example` to `.env.local` to change the public prefix or backend proxy target. Keep APP_ORIGIN on the backend consistent with the browser origin.

## Validate

```sh
npm run check
npm run build
npm run build:demo
```

All requests go through the typed client, include cookie credentials, and validate the response envelope. Production does not bundle the device-local mock transport. It intentionally displays the public seeded member and administrator credentials. Set `VITE_SHOW_DEMO_ACCOUNTS=false` to hide this panel in a new build. There is no JWT in browser storage.

## Docker

The Dockerfile defaults to real API mode. To build an explicit review image below a path:

```sh
docker build -t wellness-tracker-frontend-review \
  --build-arg VITE_PUBLIC_BASE_PATH=/webdev/wellness-tracker \
  --build-arg VITE_API_MODE=mock .
```

An ingress must strip that prefix before forwarding to the container. See workspace `docs/deployment.md`. Rebuild when the public base path changes.

## Integration

Read `docs/frontend-readiness.md`, `docs/api-contract.md`, and `docs/developer-handoffs.md` in the workspace. `src/types/contracts.ts` is generated from the canonical contract; do not edit it directly. No parent package is needed to build this application.

The SVG brand mark and favicon are in `public/brand-mark.svg`. Font licenses ship in `public/licenses/`. Review screenshots are local artifacts under `screenshots/` and are excluded from Git and Docker build contexts.
