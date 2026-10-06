# Frontend readiness

The frontend is complete against contract v1 and integrated with the persistent backend. The Docker stack is ready for final local acceptance. VM deployment remains with the project owner.

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

- Frontend lint, strict type checks, formatting, and 29 focused tests pass.
- Both applications' root checks pass, including 16 backend unit tests, 22 isolated MongoDB integration tests, and contract synchronization.
- Real production frontend build passes and excludes the device-local mock storage and transport. Public seeded demo credentials are intentionally included in the login panel.
- Desktop and mobile screenshots were captured and inspected for every required screen. Mobile layouts were checked at 375 CSS pixels with no horizontal page overflow. Desktop review covered 1309 and 1440 CSS pixels.
- Calendar selection, demo member/admin login, account switching, and saving an existing admin rule were checked through the preview.
- A compiled Docker demo ran behind a temporary Nginx ingress at `/webdev/wellness-tracker`. All frontend routes returned the SPA, static assets and icons returned the correct MIME types, missing assets returned 404, and a browser login reached the prefixed Today route with populated data.

The screenshots are local review artifacts in `frontend/screenshots/` and are not shipped with the application. This review used focused checks and screenshots rather than a large browser automation suite.

## Real-stack verification

The production Docker images were built and tested behind a local gateway at `/wellness`. Authenticated MongoDB runs as a writable replica set with a dedicated application account. HTTP smoke checks passed for registration, login/logout, cookie flags and scope, Origin rejection, ownership, CRUD, duplicate and validation errors, concurrent saves, scoring, goals, insights, leaderboard privacy, and admin rule changes.

A browser registered a real member, saved all nine fields, received 18 points, and retained the saved record after reload and a backend restart. Real insights matched the saved readings and points. Sparse-history review found and corrected invisible isolated readings by adding chart markers. Desktop and mobile screenshots were inspected; the mobile layout had no horizontal overflow. Browser security headers remain compatible with the application.

Screenshots are ignored local artifacts in `frontend/screenshots/`, including `real-stack-today.jpg` and `real-stack-insights-mobile.jpg`. Production excludes mock transport; real seeded demo histories live in MongoDB. The login panel displays credentials and fills the form without submitting it. The interface uses same-origin cookie authentication throughout.

## Acceptance

Follow `docs/local-testing.md`. The project owner performs final local testing, then follows `docs/deployment.md` for VM deployment. The API contract and developer map document the implementation boundaries. Exact pause/resume history remains outside the supplied Habit model; existing historical snapshots are authoritative, and missing historical dates use available state and creation/deletion boundaries.

The public brand is Wellness Tracker. The header, authentication screens, page titles, SVG mark, favicon, and touch icon use this name. Public demo emails use `@demo.wellness.example`; the controlled seed updates marked demo accounts in place and preserves their saved history and password.
