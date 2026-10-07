# API contract v2

This addendum resolves details left open in the supplied implementation guide. This contract retains the supplied documents' architecture and domain boundaries. These choices retain the frameworks, domain models, authentication design, and deployment topology. Review contract changes before updating their consumers.

`contracts/wellness.ts` is the executable request/response schema source. Both app-local copies are generated. `backend/src/types/analytics.ts` additionally freezes internal read-service ports to separate database reads from pure analytics.

## Transport

Internal routes begin `/api`. Browser routes begin `${appBasePath}/api`. Vite and host Nginx strip the public prefix. No backend `basePath`, broad CORS, JWT in browser storage, or direct browser database access.

JSON success is `{ "data": value }`; JSON failure is `{ "error": { "code": string, "message": string, "details"?: object } }`. Responses with private data use `Cache-Control: no-store`. Logout and all deletes use 204 with no body. Create uses 201. PATCH and reads use 200. Validation uses 400, missing session 401, denied role 403, missing record 404, duplicate or capacity conflict 409, dependency failure 503.

Dates are validated `YYYY-MM-DD` local calendar dates. Timestamps are UTC ISO strings. IDs are serialized MongoDB ObjectId strings. Reject server-owned and unknown request fields. Never accept ownership, role, point awards, snapshots, completion, or timestamps from writes.

## Endpoint mapping

Names below reference exports in `contracts/wellness.ts`. List responses are arrays inside the data envelope. All non-auth/non-health endpoints require a session. Administrator endpoints additionally require persisted role `admin`.

| Method and internal path          | Input                           | data response                                |
| --------------------------------- | ------------------------------- | -------------------------------------------- |
| POST /api/auth/register           | registerInputSchema             | userDtoSchema, 201 and session cookie        |
| POST /api/auth/login              | loginInputSchema                | userDtoSchema and session cookie             |
| POST /api/auth/logout             | no body                         | 204 and cleared cookie                       |
| GET /api/auth/me                  | none                            | userDtoSchema or 401                         |
| GET /api/users/me                 | none                            | userDtoSchema                                |
| PATCH /api/users/me               | profilePatchSchema              | userDtoSchema                                |
| GET /api/check-ins                | from, to; optional view=summary | checkInDtoSchema[] or checkInSummarySchema[] |
| POST /api/check-ins               | createCheckInInputSchema        | checkInDtoSchema, 201                        |
| GET /api/check-ins/:localDate     | localDateSchema                 | checkInDtoSchema or 404                      |
| PATCH /api/check-ins/:localDate   | checkInPatchSchema              | checkInDtoSchema or 404                      |
| DELETE /api/check-ins/:localDate  | localDateSchema                 | 204 or 404                                   |
| GET /api/habits                   | none                            | habitDtoSchema[]                             |
| POST /api/habits                  | habitInputSchema                | habitDtoSchema, 201                          |
| GET /api/habits/:id               | idSchema                        | habitDtoSchema or 404                        |
| PATCH /api/habits/:id             | habitPatchSchema                | habitDtoSchema or 404                        |
| DELETE /api/habits/:id            | idSchema                        | 204 or 404                                   |
| GET /api/insights                 | from, to                        | insightsDtoSchema                            |
| GET /api/leaderboard              | none                            | leaderboardEntrySchema[]                     |
| GET /api/admin/point-triggers     | none                            | pointTriggerDtoSchema[]                      |
| GET /api/admin/point-rules        | none                            | pointRuleDtoSchema[]                         |
| POST /api/admin/point-rules       | pointRuleInputSchema            | pointRuleDtoSchema, 201                      |
| PATCH /api/admin/point-rules/:id  | pointRulePatchSchema            | pointRuleDtoSchema or 404                    |
| DELETE /api/admin/point-rules/:id | idSchema                        | 204 or 404                                   |
| GET /api/health                   | none                            | healthDtoSchema, status=ok                   |
| GET /api/health/ready             | none                            | healthDtoSchema, status=ready or 503         |

Registration creates users only, normalizes email, uses Thailand calendar time and leaves all five targets null unless explicitly supplied during registration, and defaults leaderboard participation to true. Duplicate normalized email is 409. Login uses a generic credential error. Session cookie is wellness_session, HttpOnly, SameSite=Lax, Secure in production, Path=PUBLIC_BASE_PATH (or /), default seven-day lifetime. Clear it with matching attributes. Verify the persisted role and user each request. Validate write Origin against APP_ORIGIN before authenticated mutations, and protect login/register against unintended cross-origin writes too.

## Partial records and PATCH

POST requires only localDate. Omitted fields receive explicit empty defaults: sleep members null, water/mood/alcohol/bowel null, main meals not_logged, snacks empty, habits initialized by the backend. A persisted empty record is partial with zero completed fields. Missing means no record and GET returns 404. Calendar summaries include completedFieldCount so an empty saved record can display as not logged. Range lists omit missing dates; the calendar derives missing markers from absent dates. Future creation and mutation are rejected against the user's current local date. Calendar list ranges may include future dates; these simply have no records.

PATCH is a shallow patch of allowed top-level fields. Omitted categories remain unchanged. A supplied sleep object includes both members. A supplied meals object includes all three main meals and snacks. Explicit null clears a nullable field. An array replaces that category; an empty array explicitly clears it. Reject an empty PATCH. No implicit upsert. UI saves serialize per date and display server-confirmed state; an explicit Save action is the initial frontend approach.

Habit writes include only habitId and completed. The backend validates ownership and date eligibility, normalizes the day's eligible rows, and adds habitNameSnapshot itself. It does not discard existing historical snapshots when an unrelated habit is renamed or deleted. Newly created habits appear for today on subsequent reads/saves but are not injected into older dates. History already captured in a check-in is authoritative for that date. For missing historical dates, use creation/deletion boundaries and the available active state; exact pause/resume history is not represented by the supplied Habit model. Do not invent a recurrence system.

Meals with not_logged or skipped omit description. Eaten allows an optional description up to 200 characters. Snacks require a nonempty description, at most ten. Water is stored in integer ml, sleep in integer minutes, mood in 1 through 5. Zero and none are explicit entries, distinct from null/not_logged.

Completion counts nine built-in fields: sleep duration, sleep quality, water, mood, breakfast/lunch/dinner state, alcohol, and bowel status. Snacks and custom habits do not block completion. DTOs include completedFieldCount, requiredFieldCount=9, completion, pointsEarned, pointAwards, and currentStreak. The server derives all of these. currentStreak always describes the user's current local day, even when the DTO represents a historical date.

## Profile, habits, and scoring

Profile PATCH may change displayName, leaderboardEnabled, or goals. All five target fields are nullable. A supplied goals object replaces the whole target object. Email, role, password, and ID are not patchable. Timezone is server-owned and fixed to Asia/Bangkok; no user timezone selection is offered. Existing localDate identities remain unchanged. Habit lists include non-deleted habits, including paused ones. Deleted habits are unavailable through GET and PATCH, cannot be restored, and are excluded from every list query. Internal deletion metadata and existing check-in snapshots remain for accurate history. Habit descriptions normalize to an empty string in DTOs. There is no count limit for active habits or submitted habit completions. Trigger keys are immutable after PointRule creation.

The eight trigger keys and default values are in guide sections 25 and 26. Rules come from the database, not frontend constants. Award identity is triggerKey for ordinary daily awards and HABIT_COMPLETE:<habitId> for per-habit awards. Streak milestones fire at exactly day 7 and day 30 of each consecutive run. Zero active habits never qualifies for all-habits-complete. Explicit alcohol logging rewards any allowed status.

Reconcile the edited day's eligibility and awards on writes. Preserve qualifying existing awards at their historical point values even if their rule was disabled, deleted, or changed. Remove disqualified awards. Newly qualifying awards use the current enabled rule. Repeated saves must not duplicate awards. Historical edits/deletions reconcile affected streak milestone awards across history; do not reprice unrelated water/sleep/habit awards. Profile goal changes do not launch historical rescoring. A later direct edit uses current goals for that edited day. Scoring writes must be serialized per user in the single-server topology and protected against lost updates. Do not silently assume Mongo transactions work on a standalone MongoDB service.

A current streak counts a completed run ending today; if today is incomplete/missing, it counts the run ending yesterday. Otherwise it is zero. Historical milestone evaluation uses the run ending on that record's date. Longest streak derives from completed date history.

## Insights

Date ranges are inclusive, ordered, and limited to 365 days. Insights reject future end dates; calendar ranges may include them. days contains one item for every date, ascending, including missing dates. Missing numeric readings are null, points/meals/habit completions zero, completion missing. Habit eligibility comes from eligibleHabitsByDate even when a check-in is missing.

Rates are percentages from 0 to 100. Return null when a denominator is zero. Averages include explicitly logged values only, including zero. Never replace unlogged readings with zero in sleep, water, or mood charts.

- Sleep/water goal rates: qualifying explicitly logged readings divided by their logged-reading counts, using current profile targets for this descriptive range comparison. A null sleep/water target produces a null goal rate and cannot earn a target award.
- Check-in completion rate: complete days divided by all calendar days in range.
- Habit completion rate: completed eligible habit-date pairs divided by all eligible habit-date pairs in range.
- Meal logging rate: main meal slots with eaten or skipped divided by three times dayCount. Snacks do not affect this rate.
- Distributions count every date; absent/null values count in notLogged. Explicit none has its own bucket.
- Per-habit rates use eligibility for that habit in range and retained snapshots for labels when appropriate.
- totalPoints and each day's pointsEarned sum stored awards in range. recordedDayCount includes partial records; completeDayCount includes only complete records.
- currentStreak and longestStreak use complete history as of the user's today, independent of the displayed range.

No medical interpretation, prediction, or sleep-versus-mood inference is included in v1.

## Leaderboard privacy

All-time eligible participants have role user and leaderboardEnabled=true. Include zero-score participants. Sort descending points, then displayName, then server-only tieBreakKey for stable ties. Rank is the one-based ordinal position. Return only rank, displayName, points, currentStreak, and isCurrentUser. The boolean identifies the viewer's row even when names duplicate; no other user's ID, email, habits, goals, or wellness data is exposed. An opted-out user has no row. No public unauthenticated leaderboard endpoint is required.

## Implementation boundaries

All contract endpoints, persistent services, seeds, and the full frontend are implemented. Trusted authorization, scoring, streaks, and metrics live in the backend. Demo calculations remain development-only. See `docs/frontend-readiness.md` for visual review and `docs/local-testing.md` for final acceptance.

## Interface behavior

Typed sleep readings are bounded to 0–24 hours and water readings to 0–12,000 ml before save. The same bounds are enforced by request validation and persistence. Optional water targets support the same maximum.

Numeric zero remains an explicit reading. Clear sleep resets both duration and quality to null; Clear water resets waterMl to null. These controls are available for current and historical check-ins. Targets can be cleared independently and never block logging. Registration presents all target fields without assigning defaults.

Profile fields and targets autosave through a serialized queue. Successful writes update private query caches; pending autosaves finish before route navigation. Failed edits remain visible with an explicit retry and ordinary unsaved-change protection. Habits have their own route and navigation item; profile is available through the account menu.
