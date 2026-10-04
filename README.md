# Daywell Wellness Tracker

A responsive wellness tracker for daily check-ins, routines, personal targets, history, insights, and lightweight points. The React frontend is complete and includes an opt-in demo workspace. The separate Next.js REST backend is scaffolded and ready for implementation.

Both applications have their own manifests, lockfiles, tooling, Dockerfiles, and API schema copies. They build independently inside the current repository and can be extracted into sibling repositories if required.

## Preview the frontend

Use Node 24 (`nvm use`). From the repository root:

```sh
npm ci --prefix frontend
npm run dev:demo --prefix frontend
```

Open `http://127.0.0.1:5173`. Choose **Explore demo** for the member experience or **Admin preview** for point configuration. Manual demo login uses `alex@example.com` or `admin@example.com`, with password `wellness123`.

The demo includes sample history and persists edits on the current device. Registering creates a new, empty demo workspace. Use sample details when exploring registration. Demo session state is separate from real authentication; production uses the backend's HttpOnly cookie.

## Connect the real backend

```sh
npm run install:apps
cp backend/.env.example backend/.env.local
# Replace JWT_SECRET and set APP_ORIGIN to the exact browser origin.
docker compose -f backend/docker-compose.dev.yml up -d
npm run dev --prefix backend
# In another terminal:
npm run dev --prefix frontend
```

Open `http://localhost:5173` for the default backend APP_ORIGIN. Normal development and production builds use the real API. There is no automatic fallback to sample data. Backend product endpoints currently return 501 until implemented; liveness and MongoDB readiness already work.

Set `VITE_PUBLIC_BASE_PATH` in `frontend/.env.local` when testing a nested path. The router, requests, fonts, logo, favicon, and lazy chunks all derive their public prefix from Vite BASE_URL. Vite and host Nginx strip the public prefix before forwarding requests. Next.js has no `basePath`.

## Check and build

```sh
npm run check
npm run build
python3 backend/deploy/nginx/test_render_snippet.py
```

`npm run check` verifies synchronized contracts, lint, strict types, focused tests, and formatting in both applications. Exact dependency versions and lockfiles support reproducible `npm ci` installs.

Frontend-only commands:

```sh
npm run check --prefix frontend
npm run build --prefix frontend
npm run build:demo --prefix frontend
```

The normal production build excludes the demo transport, sample accounts, and sample credentials. The demo build is intended for review. Do not use it as a production authentication system.

## Development references

- `docs/frontend-readiness.md`: completed frontend scope, verification, and backend integration checklist.
- `docs/developer-handoffs.md`: scoped backend implementation assignments.
- `docs/api-contract.md`: exact payloads, units, PATCH semantics, and analytics definitions.
- `contracts/wellness.ts`: canonical Zod request and response schemas.
- `docs/contributing.md`: development and commit conventions.
- `docs/deployment.md`: Docker and existing host Nginx integration.
- `docs/references/`: product and implementation references.

After an agreed contract change, edit the canonical schema and run `npm run contracts:sync`. Generated app-local copies keep separate build contexts possible. The backend owns trusted authorization, scoring, streaks, and statistics; the frontend consumes validated DTOs.
