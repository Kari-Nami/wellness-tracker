# Local acceptance

The complete stack is available at [localhost:18081/wellness](http://localhost:18081/wellness/). The temporary gateway redirects alternate hostnames such as 127.0.0.1 to the configured APP_ORIGIN, keeping cookie scope and write Origin checks consistent. The temporary local gateway simulates public subpath routing, while production images retain Secure cookies. VM traffic must use HTTPS.

## Startup

From the repository root, use Node 24 and Docker:

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

Configuration is ignored and protected with file mode 600. Re-running setup preserves it. Default local ports are 18081 for ingress, 18082 for frontend, and 13001 for backend. MongoDB is not published. Change ports and APP_ORIGIN together if they are occupied. The ingress service is named `temp-gateway`, producing a container such as `daywell-local-temp-gateway-1`. It is temporary VM simulation infrastructure. The local ingress overlay requires a non-root PUBLIC_BASE_PATH; the production host renderer supports root or nested paths.

Register a member account through the UI, or choose one of the shared demos on the login screen. Autofill does not submit the form; press Sign in afterward. All demos use `wellness123`.

| Account            | Email                        | Access                                                |
| ------------------ | ---------------------------- | ----------------------------------------------------- |
| Alex Morgan        | alex@demo.wellness.example   | Member with varied history                            |
| Maya Chen          | maya@demo.wellness.example   | Member with consistent habits and a thirty-day streak |
| Jordan Lee         | jordan@demo.wellness.example | Member with mixed daily progress                      |
| Demo administrator | admin@demo.wellness.example  | Point-rule administration                             |

The member demos include ninety days of sample check-ins, meal descriptions, habits, awards, and insights. They are shared accounts, so visitors see one another's changes. Re-running `npm run seed -- demo` preserves saved records and backfills missing sample dates. Use a personal account for your own entries. The operator credentials are ADMIN_EMAIL and ADMIN_PASSWORD in `backend/.env.docker.local`. Existing operator passwords are preserved by the seed. You can also use the existing local review member `local-review@example.com`, password `local-review-2026`, in the current test database. This account is local test data and is not seeded into other environments.

## Acceptance steps

- [ ] Register, sign out, sign back in, and reload. Confirm session persistence and private route protection.
- [ ] Save a partial check-in, then log all nine fields. Try zero water, skipped meals, and none statuses. Confirm completion and points.
- [ ] Add, edit, pause/resume, and archive a habit. Complete it today and confirm its points without duplicate awards on repeat saves.
- [ ] Add or correct an earlier calendar day, then delete a disposable day. Future dates must remain read-only.
- [ ] Change or clear personal targets, edit your display name, and toggle leaderboard participation. Verify automatic save feedback and opt-out. All dates use Thailand time.
- [ ] Inspect 7/30/90-day and custom insights, including missing dates and single readings.
- [ ] Sign in as the operator, adjust a rule, disable it, and recreate a deleted rule. Existing qualifying awards must retain their historical values.
- [ ] Check mobile navigation, Save controls, dialogs, and unsaved-change protection.

Automated checks:

```sh
npm run check
npm run build
npm run test:integration
npm run test:stack
python3 backend/deploy/nginx/test_render_snippet.py
```

Integration tests start a unique disposable MongoDB replica set and remove it afterward. Stack checks operate only on local origins. They create test accounts, restore modified rule settings, delete their check-in, archive their habit, and opt their accounts out of the leaderboard. They leave no sample production data in the images.

## Stop and restart

```sh
docker compose --env-file backend/.env.docker.local \
  -f backend/docker-compose.prod.yml -f backend/docker-compose.local.yml stop
# Preserve the volume when removing containers:
docker compose --env-file backend/.env.docker.local \
  -f backend/docker-compose.prod.yml -f backend/docker-compose.local.yml down
```

Restart using `up -d --wait`; add `--build` after source changes. Restart the temporary local gateway after replacing application containers if Docker assigns new addresses. Keep the generated environment file stable because changing init credentials does not update users inside an existing volume. Delete the local database volume only when intentionally resetting disposable local data.

## Native development

```sh
npm run setup:local
docker compose -f backend/docker-compose.dev.yml up -d
npm run seed --prefix backend -- demo
npm run dev --prefix backend
# In another terminal:
npm run dev --prefix frontend
```

Open `http://localhost:5173`. Native development uses a separate loopback MongoDB volume and backend `.env.local`, not the Docker acceptance database. The normal Vite proxy forwards same-origin API requests. Use `npm run dev:demo --prefix frontend` only for the explicit frontend demo. Do not run two Vite processes on the same port.

## Verified implementation

On October 8, 2026, 35 frontend tests, 16 backend unit tests, 24 real MongoDB integration tests, both production builds, routing-renderer tests, authenticated Docker startup, HTTP stack smoke, browser session/check-in persistence, desktop/mobile screenshot review, and a local backup/restore round trip passed. Hosted CI and VM acceptance require the later repository publication and owner deployment.
