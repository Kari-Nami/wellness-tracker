# Frontend readiness

The frontend is complete against contract v2 and integrated with the persistent backend. The Docker stack is ready for final local acceptance. VM deployment remains with the project owner.

## Implemented scope

| Area            | Behavior                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication  | Registration, sign-in, password visibility, fixed Thailand dates and nullable onboarding targets, logout, session loading/error handling, member/admin route guards, private-cache clearing on identity changes   |
| Today           | Sleep duration/quality, quick hydration increments, mood, main meal states/descriptions, optional snacks, alcohol/bowel status, daily habits, explicit Save, completion progress, server-confirmed points/streaks |
| History         | Calendar range queries, colored day circles and accessible status labels, future-date restrictions, selected-day summaries, historical add/edit/delete, deletion confirmation                                     |
| Insights        | 7/30/90-day and custom ranges; sleep/water/mood/points charts; completion, goals, habit rates; status distributions; current/longest streaks; empty/error states                                                  |
| Leaderboard     | All-time public-safe rows, current-member identification, opt-out messaging, points/streak display, zero-score and empty handling                                                                                 |
| Profile         | Display name and leaderboard preference autosave; all targets are nullable and can be cleared; save/retry feedback                                                                                                |
| Habits          | Create/edit, pause/resume, no habit count limit, confirmed deletion, retained historical labels                                                                                                                   |
| Administration  | Supported-activity dropdown, point-rule create/edit/delete, enable/disable, integer validation, unused activity filtering                                                                                         |
| Shared behavior | Responsive navigation, keyboard focus, accessible dialogs, unsaved-change confirmation, unload protection, midnight draft preservation, retry/loading/empty states, recovery and not-found pages                  |
| Branding        | Original SVG mark in the header and auth screens, SVG favicon, touch icon, local fonts and font licenses                                                                                                          |

## Review and validation

Verified on October 8, 2026:

- Frontend lint, strict type checks, formatting, and 36 focused tests pass.
- Both applications' root checks pass, including 16 backend unit tests, 25 isolated MongoDB integration tests, and contract synchronization.
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

## Usability update

Page headers now show a compact description instead of decorative titles and eyebrows. The leaderboard uses one full-width table with only the current member highlighted. Administration starts directly with the rule list and Add point rule. Today includes clear numeric logging controls, five-point star and bowel icons, and a prominent delete button below point activity. Calendar status uses full colored day circles. Insights use direct chart names and plain habit/day labels; the meal logging footnote and decorative encouragement panels were removed. Habits have a dedicated page.

An isolated local account verified that display-name and target edits persist when navigating away immediately. Review screenshots are saved as `revision-*.jpg` for registration, Today, Calendar, Insights, Leaderboard, Habits, Profile, and Administration at desktop and mobile sizes.

Regression checks cover onboarding without targets, clearing all fields to zero logged fields, null-target scoring/rates, serialized autosave edits, failure/retry, and the fixed Thailand day boundary.

Chart footnotes are removed; daily points show their selected-range total in the chart heading. The leaderboard header uses the same white date-chip treatment as Today. Numeric check-in inputs clamp typed values immediately to 24 hours and 12,000 ml. Habit creation and resuming have no count limit, and deleted habits cannot be accessed or restored through the API.
