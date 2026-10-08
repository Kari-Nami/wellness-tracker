# Wellness Tracker

<div align="center">
  <img src="frontend/public/brand-mark.svg" width="72" alt="Wellness Tracker brand mark" />
</div>


![Node](https://img.shields.io/badge/node-24-5FA04E?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/typescript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-8-646CFF?logo=vite&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-16-000000?logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwind_css-4-06B6D4?logo=tailwindcss&logoColor=white)
![MongoDB](https://img.shields.io/badge/mongodb-8.2-47A248?logo=mongodb&logoColor=white)
![Zod](https://img.shields.io/badge/zod-4-3068B7?logo=zod&logoColor=white)
![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4?logo=prettier&logoColor=white)

A self-hosted daily wellness tracker. Check in once a day, keep streaks, earn points, and watch trends over a calendar history. The leaderboard is private by default and members opt in.

## Features

- **Daily check-in**: nine fields (sleep duration and quality, water, mood, three meals, alcohol status, bowel status) with partial saves and tap-to-clear inputs
- **Habits**: a personal daily checklist with soft delete and completion tracking
- **Personal targets**: optional sleep, water, meal, mood, and bowel targets that drive goal-based point triggers
- **Points**: twenty triggers covering logging actions, goal hits, streaks, and perfect days. Administrators tune values or disable rules. Awards reconcile per instance key, so retries never double pay
- **Streaks**: current and longest complete check-in streaks plus alcohol-free runs
- **Calendar history**: month navigation with full editing of past days
- **Insights**: per-day series and aggregates over any 1 to 365 day window: averages, goal rates, alcohol and bowel distributions, and per-habit completion
- **Leaderboard**: points and streak ranking for opted-in members
- **Demo mode**: a mock transport with device-local sample data. Production builds exclude it
- **Roles**: member and administrator, with an admin point-rule editor

## Architecture

Two independently buildable applications plus a shared contract package. Either app can be extracted without shared runtime code.

| Part | Stack | Role |
| --- | --- | --- |
| `frontend/` | React 19, Vite 8, Tailwind CSS 4, TanStack Query 5, React Router 7, Recharts, Radix UI, react-hook-form | SPA with lazy routes, Fraunces and Manrope variable fonts, mobile-first layout |
| `backend/` | Next.js 16 route handlers, Mongoose 9, MongoDB 8 replica set, jose, bcryptjs, pino | REST API only. Owns authorization, validation, completion, scoring, streaks, and statistics |
| `contracts/` | Zod 4 | Canonical API schemas (version 2.2.0) synced into both apps |

Design decisions worth knowing:

- `contracts/wellness.ts` is the single source of truth for every payload, enum, and unit. Generated copies land in each app and validate every boundary, including responses the frontend receives. After an agreed contract change, run `npm run contracts:sync` and commit the regenerated files.
- Check-in writes run in MongoDB transactions with snapshot reads and majority writes. A per-user mutation revision serializes concurrent writes across processes.
- Sessions are HS256 JWTs in `HttpOnly` `SameSite=Lax` cookies (`Secure` in production), scoped to the public base path. Nothing session-related touches browser storage. Passwords use bcrypt with a domain-separated SHA-256 prehash, plus login throttling and origin checks.
- Calendar days are pinned to one timezone (`Asia/Bangkok`) so a check-in means the same day for history, insights, and streaks.
- The API speaks a `{ data }` envelope and a typed `{ error: { code, message } }` shape on every endpoint.

## Getting started

Requirements: Node 24 (`>=24 <25`) and Docker.

### Full stack with Docker

From the repository root:

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

Open [http://localhost:18081/wellness/](http://localhost:18081/wellness/) and register a member account. The sign-in screen lists the shared demo accounts below with autofill buttons.

`setup:local` generates random secrets, writes ignored env files with mode 600, and preserves existing configuration. The local stack runs production builds behind an Nginx gateway with authenticated MongoDB as a single-member replica set. Published ports bind to loopback: gateway 18081, frontend 18082, backend 13001. MongoDB is not published. Use `localhost` consistently so Secure cookies work locally.

### Native development

Backend:

```sh
npm ci --prefix backend
cp backend/.env.example backend/.env.local   # replace JWT_SECRET with a random 32+ character value
docker compose -f backend/docker-compose.dev.yml up -d
npm run seed --prefix backend -- demo
npm run dev --prefix backend                 # http://127.0.0.1:3000
```

Frontend in another shell:

```sh
npm ci --prefix frontend
npm run dev --prefix frontend                # http://127.0.0.1:5173, proxies /api to the backend
```

### Demo mode without a backend

```sh
npm run dev:demo --prefix frontend           # http://127.0.0.1:5173
```

Runs the same UI against a device-local mock transport. Registrations start empty. The mock ships only in demo builds.

### Demo accounts

Seeded accounts for the real API, all with password `wellness123`:

| Account | Email | Shows |
| --- | --- | --- |
| Alex Morgan | `alex@demo.wellness.example` | A balanced routine with room to improve |
| Maya Chen | `maya@demo.wellness.example` | Consistent habits and a thirty-day streak |
| Jordan Lee | `jordan@demo.wellness.example` | Small steps and a varied history |
| Demo administrator | `admin@demo.wellness.example` | The point-rule editor, excluded from the leaderboard |

The separate operator login uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the generated `backend/.env.docker.local`. Demo mode accounts are `alex@example.com` and `admin@example.com`, password `wellness123`. Seeded credentials are public by design and displayed on the sign-in screen. Set `VITE_SHOW_DEMO_ACCOUNTS=false` to hide the panel.

## API surface

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account and open a session |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Current session profile |
| GET, PATCH | `/api/users/me` | Display name, targets, leaderboard visibility |
| GET | `/api/check-ins?from=&to=&view=summary\|full` | History range |
| POST | `/api/check-ins` | Create a check-in for a local date |
| GET, PATCH, DELETE | `/api/check-ins/{localDate}` | Read, update, or remove one day |
| GET, POST | `/api/habits` | List and create habits |
| GET, PATCH, DELETE | `/api/habits/{id}` | Manage one habit (delete is soft) |
| GET | `/api/insights?from=&to=` | Aggregates over 1 to 365 days |
| GET | `/api/leaderboard` | Ranks for opted-in members |
| GET | `/api/admin/point-triggers` | Trigger catalog |
| GET, POST | `/api/admin/point-rules` | Point rules (admin) |
| PATCH, DELETE | `/api/admin/point-rules/{id}` | Tune or disable a rule (admin) |
| GET | `/api/health` | Liveness, no MongoDB required |
| GET | `/api/health/ready` | Readiness, verifies indexes and a writable primary |

## Scripts

| Script | What it does |
| --- | --- |
| `npm run install:apps` | Clean install of both apps |
| `npm run contracts:sync` | Regenerate the app copies of the canonical contract |
| `npm run contracts:check` | Fail if a generated copy has drifted |
| `npm run check` | Contracts, lint, strict types, unit tests, and formatting for both apps |
| `npm run build` | Production build for both apps |
| `npm run setup:local` | Write ignored local env files with random secrets |
| `npm run test:integration` | Backend integration tests against a disposable MongoDB replica set |
| `npm run test:stack` | End-to-end smoke tests against the seeded local Docker stack |

## Verification and CI

```sh
npm run check
npm run build
npm run test:integration
npm run test:stack
python3 backend/deploy/nginx/test_render_snippet.py
```

The GitHub Actions workflow runs all of these on pushes to `main` and on pull requests, including a full Docker smoke test that builds, seeds, and tears down an isolated stack. Seeds are explicit commands, never startup behavior. Re-running the rule seed restores missing default rules and preserves existing configuration.

## Project layout

```
frontend/    React SPA: src/api, src/features, src/components, src/mocks
backend/     Next.js API: src/app/api, src/services, src/models, src/lib
contracts/   wellness.ts (schemas) and demoAccounts.ts
scripts/     contract sync and local setup tooling
```

Each app keeps its own manifest, lockfile, tooling, Dockerfile, and generated schema copy under `src/types/contracts.ts`. Never edit a generated copy directly.

## Configuration

Backend (`backend/.env.local` natively, `backend/.env.docker.local` for Docker):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Replica set connection string |
| `JWT_SECRET` | HS256 signing key, at least 32 characters |
| `JWT_EXPIRES_IN` | Session lifetime, `7d` default, one minute to thirty days |
| `APP_ORIGIN` | Browser origin accepted for origin checks and cookies |
| `PUBLIC_BASE_PATH` | URL prefix the app is served under |
| `LOG_LEVEL` | pino log level |

The Docker env adds Mongo credentials and replica key, host ports, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the operator seed. See `backend/.env.example` and `backend/.env.production.example` for the full lists.

Frontend (`frontend/.env.local`):

| Variable | Purpose |
| --- | --- |
| `VITE_PUBLIC_BASE_PATH` | Public base path, `/` by default |
| `BACKEND_PROXY_TARGET` | Dev proxy target, `http://127.0.0.1:3000` by default |
| `VITE_API_MODE` | `real` (default) or `mock` |
| `VITE_SHOW_DEMO_ACCOUNTS` | Show seeded credentials on the sign-in screen |

## License

No license is published yet. All rights reserved by the repository owner.
