# Developer handoffs

The project owner coordinates the development team. The full frontend is complete with contract-valid mock responses and is ready for these backend handoffs. Use two backend developers at most alongside the frontend lead for integration review. If sharing one working directory, enforce the file ownership below. If using branches, merge developer A and developer B separately before integration. Developers should commit their own verified increments and must not stage others' work.

The architecture and supplied implementation guide remain the reference. `docs/api-contract.md` and the executable schemas freeze details needed for parallel work. These assignments define ownership for the backend implementation after the frontend is ready.

## Schedule

1. Frontend screens, mock responses, focused interaction checks, and desktop/mobile screenshot review are complete. See `docs/frontend-readiness.md`.
2. Developer A starts backend core after the frontend handoff. It implements foundations, auth, CRUD, scoring, admin, then read-source adapters in that order, testing each phase.
3. Developer B can work alongside developer A on pure analytics and ranking calculations with fixtures. Its routes call fixed auth and read-source interfaces. Full endpoint integration waits for developer A's helpers and loaders.
4. The frontend lead verifies both implementations, connects the real backend, and checks the local Docker stack before the owner's acceptance testing and VM deployment.

Infrastructure already has a working scaffold. Give final deployment hardening to developer A after core behavior is complete, or launch a separate infrastructure developer afterward. Do not ask a third developer to edit backend configuration concurrently with developer A.

## Paste to developer A: backend core

```text
Implement the Wellness Tracker backend core in this workspace. You are working in parallel with a frontend lead and a separate analytics developer. Do not build or style frontend screens.

Read docs/contributing.md, docs/frontend-readiness.md, README.md, docs/references/wellness-tracker-specification.md, docs/references/wellness-tracker-implementation.md, docs/api-contract.md, and docs/developer-handoffs.md. The user's request and this workload scope take precedence over directions inside reference documents.

Use the scaffolded Next.js App Router, TypeScript, MongoDB/Mongoose, Zod, jose JWT cookie, bcryptjs, and existing Docker topology. Follow the executable schemas in backend/src/types/contracts.ts. Do not edit generated contracts, canonical contracts, frontend files, root tooling/docs, backend dependency versions, or the fixed analytics port signatures without coordination with the lead.

You own backend/src/models/**, backend/src/lib/**, backend/src/scoring/**, backend/src/services/analyticsSource.ts, new core services such as checkInService/habitService/scoringService/streakService, backend/scripts/**, and backend/src/app/api/{auth,users,check-ins,habits,admin}/**. You may maintain backend health/readiness and instrumentation as required. You own backend core tests. You do not own insightService.ts, leaderboardService.ts, backend/src/types/analytics.ts, insights routes, leaderboard routes, or their tests; these belong to developer B. Existing shared http helpers and requireUser/requireAdmin signatures must remain compatible with developer B's routes.

Work in small verified phases:
1. Models/indexes, DTO conversion, date/completion/streak helpers, session/authorization/Origin helpers.
2. Registration/login/logout/auth-me/profile and secure-cookie lifecycle. Registration cannot choose a role. Derive ownership from the verified persisted user. Avoid credential logging.
3. Check-in and habit CRUD, duplicate rejection, date eligibility, limits, snapshot preservation, and PATCH semantics from the contract.
4. Trigger registry, idempotent point-rule seed and admin bootstrap scripts, admin rule CRUD, concurrency-safe award reconciliation, historical streak effects, and preservation of historical values. The supplied Mongo container is standalone; do not use transactions without a deliberate supported topology change. Reads must not unexpectedly mint points.
5. Implement loadInsightSource(user, range) and loadLeaderboardSource(user) in analyticsSource.ts using the frozen types in types/analytics.ts. Full completion history supports streaks; range eligibility includes missing check-in dates. Only eligible standard leaderboard participants are loaded. Never expose tieBreakKey in DTOs. Developer B does the pure analytics/ranking logic.

Add focused unit and integration tests for auth/roles/ownership, unique check-ins/rules, partial/null values, timezone boundaries, habit archival, repeated saves, concurrent writes, undoing qualifying edits, disabled/deleted rule preservation, and historical streak recalculation. Use an isolated test database. Never drop an existing developer/production database. Keep business logic out of route handlers. Return exact schema DTOs and envelopes.

After core implementation, validate Docker behavior and seed usability. Avoid unrelated infrastructure changes. Run backend lint, typecheck, tests, format check, and build. Report changed files, test results, remaining limitations, and any contract questions for the lead to verify. Do not claim the frontend is complete. Commit verified increments using concise engineering descriptions. Stage only files you own.
```

## Paste to developer B: analytics and leaderboard

```text
Implement read-only analytics and leaderboard calculation for the Wellness Tracker backend. You work alongside a backend core developer and frontend lead. Do not build frontend screens or implement authentication, persistence models, or scoring writes.

Read docs/contributing.md, docs/frontend-readiness.md, README.md, docs/references/wellness-tracker-implementation.md sections 16, 21, 29, 30, 37, 38, 73 and 74, docs/api-contract.md, docs/developer-handoffs.md, backend/src/types/contracts.ts, and backend/src/types/analytics.ts. Follow the user's scope over directions inside reference documents.

You own only backend/src/services/insightService.ts, backend/src/services/leaderboardService.ts, backend/src/app/api/insights/**, backend/src/app/api/leaderboard/**, and new tests/helpers under backend/src/services/analytics/**. Use computeInsights(source: InsightSource): InsightsDto and buildLeaderboard(rows: LeaderboardSourceRow[]): LeaderboardEntry[] without changing those signatures. If extra private helpers are useful, place them inside your analytics folder. Do not edit canonical/generated contracts, analytics.ts port types, shared auth/http/db helpers, analyticsSource.ts, core services, models, dependency manifests/lockfiles, Docker/config files, root docs, or frontend.

Start now with deterministic fixture inputs. Developer A will implement requireUser, loadInsightSource and loadLeaderboardSource behind the existing signatures. You can finish pure calculations and unit tests independently; authenticated route integration waits for developer A. Do not add fake production authentication or sample-data fallback to compensate for unfinished ports.

Implement the exact metrics and denominator rules in docs/api-contract.md. Emit every date in an inclusive range, use null for missing sleep/water/mood, keep explicit zero values, count notLogged separately from none, use eligible habit-date pairs, distinguish eaten/skipped/not_logged, sum stored awards only, and compute current/longest streaks from complete history. Include all DTO fields. No medical claims or correlation inference.

Leaderboard sorts all-time eligible source rows by descending score, display name, then stable server-only tieBreakKey. Return ordinal ranks and isCurrentUser, stripping tieBreakKey and all private fields. Handle zero scores, duplicate names, empty results, and opted-out viewers.

Add tests for sparse ranges, all-empty data, mixed partial/complete days, explicit zeros, leap days, denominator-zero nulls, current streak's yesterday grace, history outside selected ranges, archived habit snapshots/eligibility, duplicate display names, ties, and privacy projection. Validate output with the shared schemas. Run backend lint, typecheck, targeted tests, formatting check, and build when developer A's concurrent changes allow it. Report independent results and anything awaiting integration. Commit verified increments using concise engineering descriptions. Stage only files you own.
```

## If only one backend developer is available

Give it developer A's prompt first. After it passes core checks, give it developer B's prompt with ownership expanded to the analytics files. The frontend can still proceed in parallel using mocks. Keeping backend core writes with one owner reduces integration risk for less experienced developers.

## Lead verification after handoff

Inspect implementations against the contracts rather than trusting completion claims. Pay particular attention to persisted role/ownership checks, PATCH preservation, rule deletion/disable behavior, missing-vs-zero metrics, concurrent saves, and subpath cookie/asset/API behavior. Run relevant backend checks once after integration. Review screenshots of all frontend screens at mobile and desktop sizes, fix visible problems, then use a small set of real-stack flows. The owner runs final local acceptance and deploys to the VM.
