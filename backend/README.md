# Wellness Tracker backend

Independent Next.js REST application. Use Node 24 and `npm ci`. Copy `.env.example` to `.env.local`, set JWT_SECRET, start development Mongo with `docker compose -f docker-compose.dev.yml up -d`, then run `npm run dev`.

Health and readiness are implemented. Product routes currently return 501. Business logic, models, auth, and seeds are assigned in the workspace `docs/developer-handoffs.md`. Do not present these stubs as functioning auth or CRUD.

Run `npm run check`, `npm run build`, and `python3 deploy/nginx/test_render_snippet.py`. Production uses the Dockerfile and `docker-compose.prod.yml`; see workspace `docs/deployment.md`.

`src/types/contracts.ts` is a generated app-local copy. `src/types/analytics.ts` defines the fixed read-service ports for the parallel backend workloads. This app builds independently without parent packages. Copy the relevant reference docs when extracting it into a separate repository.
