# Wellness Tracker

Scaffold for a React frontend and a separate Next.js REST backend. Product screens, authentication, persistence models, scoring, and analytics are not implemented yet. This phase intentionally stops before UI implementation.

The existing parent Git repository is retained. Both applications have their own manifests, lockfiles, tooling, Dockerfiles, and self-contained API schema copies. Neither application needs a parent npm workspace to build. They can later be extracted into sibling repositories as described by the implementation guide; Git history has not been restructured here.

## Start locally

Use Node 24 (`nvm use`) and Docker Compose. From the repo root:

```sh
npm run install:apps
cp backend/.env.example backend/.env.local
# Replace JWT_SECRET. APP_ORIGIN must match the browser origin exactly.
docker compose -f backend/docker-compose.dev.yml up -d
npm run dev --prefix backend
# In another terminal:
npm run dev --prefix frontend
```

Open `http://localhost:5173`. Use localhost consistently because it is the default APP_ORIGIN. The browser calls the same origin through Vite's API proxy. Registration and all product API routes currently return 501. Liveness is `/api/health`; readiness is `/api/health/ready`.

Set `VITE_PUBLIC_BASE_PATH` in `frontend/.env.local` to exercise nested routing locally. Vite's proxy strips the same public prefix before reaching Next.js. Changing the prefix requires a frontend rebuild for production. Next.js has no `basePath`.

## Check and build

```sh
npm run check
npm run build
python3 backend/deploy/nginx/test_render_snippet.py
```

`npm run check` verifies contract synchronization and both applications' lint, strict types, tests, and formatting. Dependencies use exact versions and checked-in lockfiles. Run `npm ci` in each app for reproducible installs.

## Contracts and next work

- `docs/api-contract.md`: API behavior, units, patch semantics, analytics definitions, and pending implementation boundaries.
- `contracts/wellness.ts`: canonical Zod request and response schemas.
- `docs/developer-handoffs.md`: paste-ready workloads for developers launched by the owner.
- `docs/deployment.md`: Docker and host Nginx setup.
- `docs/references/wellness-tracker-specification.md`: supplied product reference.
- `docs/references/wellness-tracker-implementation.md`: supplied implementation reference.

Edit the canonical schema, then run `npm run contracts:sync`. This generates `frontend/src/types/contracts.ts` and `backend/src/types/contracts.ts`. App-local generated copies make separate checkout/build contexts possible. Contract changes require agreement with the lead frontend developer.

The frontend includes route placeholders, TanStack Query, a base-aware API client, runtime DTO validation, and feature folders. Route protection and mock API scenarios belong to the next frontend phase. Placeholders currently have no session and are accessible only to demonstrate route wiring.

Backend handlers exist for every specified endpoint. Except for health/readiness, they are stubs or depend on explicit stubs. The backend foundation includes environment validation, a reusable database connection, structured logging, an error envelope, and fixed analytics integration signatures.

Tooling setup follows the official [Vite documentation](https://vite.dev/guide/), [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation), and [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).
