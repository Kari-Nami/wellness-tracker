# Frontend readiness

The frontend is complete against contract v1 and is ready for backend implementation. Backend product endpoints remain scaffolded. Full-stack acceptance and deployment follow backend integration.

## Implemented scope

| Area            | Behavior                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication  | Registration, sign-in, password visibility, detected timezone, logout, session loading/error handling, member/admin route guards, private-cache clearing on identity changes                                      |
| Today           | Sleep duration/quality, quick hydration increments, mood, main meal states/descriptions, optional snacks, alcohol/bowel status, daily habits, explicit Save, completion progress, server-confirmed points/streaks |
| History         | Calendar range queries, non-color status markers, future-date restrictions, selected-day summaries, historical add/edit/delete, deletion confirmation                                                             |
| Insights        | 7/30/90-day and custom ranges; sleep/water/mood/points charts; completion, goals, habit and meal rates; status distributions; current/longest streaks; empty/error states                                         |
| Leaderboard     | All-time public-safe rows, current-member identification, opt-out messaging, points/streak display, zero-score and empty handling                                                                                 |
| Profile         | Display name, timezone, complete target object, optional mood/bowel targets, leaderboard preference, save feedback                                                                                                |
| Habits          | Create/edit, pause/resume, ten-active-habit constraint, confirmed archival, retained historical labels                                                                                                            |
| Administration  | Supported-activity dropdown, point-rule create/edit/delete, enable/disable, integer validation, unused activity filtering, historical-award explanation                                                           |
| Shared behavior | Responsive navigation, keyboard focus, accessible dialogs, unsaved-change confirmation, unload protection, midnight draft preservation, retry/loading/empty states, recovery and not-found pages                  |
| Branding        | Original SVG mark in the header and auth screens, SVG favicon, touch icon, local fonts and font licenses                                                                                                          |

## Review and validation

Verified on October 8, 2026:

- Frontend lint, strict type checks, formatting, and 26 focused tests pass.
- Both applications' root checks pass, including the ten existing backend foundation tests and contract synchronization.
- Real production frontend build passes and excludes the demo storage identifiers, sample names, and sample credentials.
- Desktop and mobile screenshots were captured and inspected for every required screen. Mobile layouts were checked at 375 CSS pixels with no horizontal page overflow. Desktop review covered 1309 and 1440 CSS pixels.
- Calendar selection, demo member/admin login, account switching, and saving an existing admin rule were checked through the preview.
- A compiled Docker demo ran behind a temporary Nginx ingress at `/webdev/wellness-tracker`. All frontend routes returned the SPA, static assets and icons returned the correct MIME types, missing assets returned 404, and a browser login reached the prefixed Today route with populated data.

The screenshots are local review artifacts in `frontend/screenshots/` and are not shipped with the application. This review used focused checks and screenshots rather than a large browser automation suite.

## Backend handoff

Use the assignments in `docs/developer-handoffs.md`. Start backend core and pure analytics/ranking work in parallel if two developers are available. The frontend is already finished; both workloads should preserve its existing contract and avoid editing frontend files.

The exact request and response schemas remain in `contracts/wellness.ts`. No schema changes were needed during frontend implementation. Existing read-service signatures in `backend/src/types/analytics.ts` support independent analytics work.

Important integration details:

1. `/api/auth/me` returns 401 for a missing session. Login/register return the safe UserDto and set the cookie. Logout and deletes return a bodyless 204. Public registration cannot select an administrator role.
2. Profile responses include the complete goals object, including nullable optional targets. Check-in GET returns 404 for a missing day; POST does not silently upsert.
3. PATCH preserves omitted categories and replaces supplied nested categories in full. Explicit null clears a logged value; zero remains an explicit value. Clients never supply awards, owner IDs, completion fields, or habit-name snapshots.
4. Check-in responses include server-derived completion count/status, awards, pointsEarned, and currentStreak. Saves invalidate only the relevant check-in, calendar, insights, and leaderboard families. Reads must not mint points.
5. Historical habit snapshots remain readable after rename or archival. The backend initializes current-day relevant habits and enforces ownership/date eligibility.
6. Insights emit every date, preserve null readings, and use the documented denominators. Leaderboard responses include isCurrentUser and never expose peer email, ID, targets, or wellness records.
7. Supported point activities and values come from the administrator API. Disabled/deleted/repriced rules must preserve valid historical awards. Backend scoring requires independent concurrency and authorization tests.
8. Use same-origin browser traffic. Cookie scope, Origin validation, public prefix, frontend build base, and ingress routing must agree.

## Connect and accept

Run the frontend in normal real API mode after the backend is implemented. Check registration/login/logout, an evolving daily record, historical corrections and deletion, habit create/complete/archive, target updates, opt-out, insights ranges, and admin rule changes. Verify permissions and score reconciliation through backend tests before treating the stack as complete.

Then run the complete production Compose stack with the configured subpath and real cookie security. The project owner performs final local acceptance testing and VM deployment.

The demo calculations live only under `frontend/src/mocks/`. They enable frontend development and review and are not the backend business implementation or a substitute for backend security tests.
