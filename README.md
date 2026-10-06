# Daywell Wellness Tracker

A responsive wellness tracker with daily check-ins, habits, personal targets, calendar history, insights, points, and a privacy-controlled leaderboard. React and Vite serve the frontend; a separate Next.js REST API persists data in MongoDB. The original SVG identity appears in the application, favicon, and touch icon.

## Run the complete stack locally

Use Node 24 and Docker. From the repository root:

```sh
npm run install:apps
npm run setup:local
docker compose --env-file backend/.env.docker.local \
  -f backend/docker-compose.prod.yml -f backend/docker-compose.local.yml \
  up -d --build --wait
docker compose --env-file backend/.env.docker.local \
  -f backend/docker-compose.prod.yml -f backend/docker-compose.local.yml \
  --profile operations run --rm --build tools npm run seed -- all
```

Open [Daywell locally](http://localhost:18081/wellness/). Register a member account. The sign-in screen shows shared demo credentials and buttons that fill the form. Three member demos include 90 days of varied history; a demo administrator opens the point-rule editor. All four use password `wellness123`. Your separate operator login uses ADMIN_EMAIL and ADMIN_PASSWORD from the generated, ignored `backend/.env.docker.local` file. The setup command generates random secrets, writes files with mode 600, and preserves existing configuration.

The local stack runs the production builds with authenticated MongoDB, a single-member replica set, and a `temp-gateway` service simulating host Nginx. MongoDB is private; published ports bind to loopback. Use localhost consistently for local Secure cookies. Public deployment uses HTTPS.

See [local testing](docs/local-testing.md) for acceptance steps, native development, and stop/restart commands. The project owner performs final acceptance and VM deployment.

## Checks

```sh
npm run check
npm run build
npm run test:integration
npm run test:stack
python3 backend/deploy/nginx/test_render_snippet.py
```

Checks cover synchronized contracts, lint, strict types, tests, and formatting. Integration tests create and remove a disposable MongoDB replica set without touching application data. Stack checks require the seeded local Docker stack and create disposable test accounts. The GitHub verification workflow runs these checks and the real Docker smoke test on pushes and pull requests; its first hosted run follows publication.

## Frontend demo

```sh
npm run dev:demo --prefix frontend
```

The optional demo at `http://127.0.0.1:5173` uses device-local sample data. Demo accounts are `alex@example.com` and `admin@example.com`, password `wellness123`. New registrations start empty. Normal development and production use the real API and exclude the local mock transport. The public credentials for seeded demo accounts are intentionally displayed in real API mode.

## Project references

- [API contract](docs/api-contract.md): payloads, units, PATCH behavior, scoring, analytics, and privacy.
- [Executable schemas](contracts/wellness.ts): canonical Zod contracts. Run `npm run contracts:sync` after an agreed change.
- [Frontend readiness](docs/frontend-readiness.md): implemented screens and visual review.
- [Developer map](docs/developer-handoffs.md): module boundaries and maintenance guidance.
- [Development workflow](docs/contributing.md): verification and commit conventions.
- [Deployment](docs/deployment.md): existing VM Nginx/Certbot integration, seeds, backup, and restore.
- [Product references](docs/references/): original product and implementation guidance with developer-facing wording.

Both applications retain independent manifests, lockfiles, tooling, Dockerfiles, and generated schema copies. They can be extracted into sibling repositories without shared runtime packages. The backend owns authorization, scoring, streaks, and metrics; the frontend validates its responses.
