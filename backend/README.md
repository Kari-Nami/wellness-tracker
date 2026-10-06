# Wellness Tracker backend

Independent Next.js REST application using Node 24, MongoDB/Mongoose, Zod, JWT cookies, and transactional scoring. All contract endpoints are implemented. See the workspace API contract for payloads, authorization, award reconciliation, and metric definitions.

## Native development

```sh
npm ci
cp .env.example .env.local
# Replace JWT_SECRET with a random value of at least 32 characters.
docker compose -f docker-compose.dev.yml up -d
npm run seed -- demo
npm run dev
```

Development MongoDB uses an unauthenticated replica set bound to loopback. Production uses authenticated private MongoDB and a separate application user. `npm run seed -- admin` requires ADMIN_EMAIL and ADMIN_PASSWORD; it creates or promotes an operator and preserves an existing account's password. `npm run seed -- demo` creates the three shared member demos with 90 days of varied history and a separate shared administrator. It also fills missing default point rules. `npm run seed -- all` runs operator, rule, and demo seeds. Seeds are explicit commands, never startup behavior. Re-running the rule seed preserves existing configuration and recreates missing default rules, including intentionally deleted ones.

## Verification

```sh
npm run check
npm run build
npm run test:integration
npm run test:stack
python3 deploy/nginx/test_render_snippet.py
```

Integration tests require Docker and use an isolated database. Stack tests require the seeded production images behind the local gateway and read `.env.docker.local` by default. They refuse non-local origins. An optional environment-file argument is supported: `npm run test:stack -- /absolute/path/to/local.env`.

Liveness does not require MongoDB. Readiness verifies indexes and a writable `rs0` primary. See workspace deployment documentation for Docker, the operations profile, host ingress, and protected backup/restore commands.

`src/types/contracts.ts` is generated from the workspace canonical contract. `src/types/analytics.ts` defines internal read inputs. This app builds independently without parent packages. Keep the relevant reference docs when extracting it.

Demo definitions are synchronized from `contracts/demoAccounts.ts`. Demo seeds only modify marked demo accounts, preserve existing records and renamed habits, and backfill missing sample dates. The shared administrator is excluded from the leaderboard. Real personal accounts are never converted into demos.
