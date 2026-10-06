# Developer map

The complete frontend and backend are implemented and integrated against contract v1. Future changes should preserve these boundaries and include verification appropriate to the affected behavior.

## Frontend

`frontend/src/api` validates envelopes and DTOs. Authentication and private-query cleanup live in `features/auth`; shared navigation and unsaved-change handling live in `components/layout` and `app`. Feature folders own check-ins, calendar, insights, leaderboard, profile, habits, and administration. `components/charts/TrendChart.tsx` preserves unlogged gaps and marks isolated readings. The SVG identity and browser icons live in `public`.

`frontend/src/mocks` supplies the explicit demo mode only. Keep mock behavior compatible with the API contract, but treat the backend as the authority for authentication, awards, and metrics. Production must never fall back to mocks.

## Backend

- `src/models`: strict persistent schemas and indexes.
- `src/lib/auth`: cookie sessions, credential hashing, persisted-role guards, Origin checks, and authentication throttling.
- `src/lib/db`: connection/index setup, read snapshots, and per-user transaction serialization.
- `src/services/checkInService.ts` and `habitService.ts`: ownership, validation, eligibility, and CRUD.
- `src/services/scoringService.ts`, `triggerRegistry.ts`, and `streakService.ts`: trusted triggers, historical award reconciliation, and calendar streaks.
- `src/services/analyticsSource.ts`: consistent database reads and eligibility inputs.
- `src/services/insightService.ts` and `leaderboardService.ts`: pure calculations and public-safe ranking.
- `src/services/pointRuleService.ts` and `seedService.ts`: controlled rule administration and explicit bootstrap.
- `src/app/api`: thin route handlers with guards and common HTTP responses.
- `src/test/integration`: isolated database tests for authentication, CRUD, scoring, analytics, privacy, and concurrency.

Keep model documents inside backend services. Return serialized DTOs rather than spreading documents into responses. Use the transaction helper for member writes; related award updates must commit with the check-in. Reads must not mint points. Do not reprice historical awards as part of unrelated changes.

## Contracts and operations

Edit `contracts/wellness.ts` for agreed API changes, then run `npm run contracts:sync`. Keep app-local copies generated. Analytics inputs in `backend/src/types/analytics.ts` preserve the separation between database access and calculations.

Deployment remains three application services: frontend, backend, and private MongoDB. The temporary local gateway and operations tooling are optional development/maintenance services. Existing host Nginx and Certbot own public ingress on the VM. Follow `docs/deployment.md` before changing routing, database topology, or credentials.

The project owner performs final local acceptance and deploys to the VM. No publication or VM changes have been performed as part of implementation.
