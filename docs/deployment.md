# Deployment

Production consists of frontend, backend, and authenticated private MongoDB containers. MongoDB runs as a single-member `rs0` replica set so check-ins and scoring commit together. Only frontend/backend ports are published, bound to loopback. Existing VM Nginx and Certbot provide public ingress and HTTPS. Application Compose does not own host ports 80 or 443.

## Configuration and startup

Keep frontend and backend as sibling directories or checkouts. Copy `backend/.env.production.example` to a protected file outside them, set real values, and run `chmod 600` on the file. Set the project name, exact HTTPS APP_ORIGIN, PUBLIC_BASE_PATH, and unused loopback host ports. Generate passwords and JWT_SECRET with `openssl rand -hex 32`; generate the stable MONGO_REPLICA_KEY with `openssl rand -base64 756`, stored as one line. Percent-encode URI-reserved characters in credentials.

The initial MongoDB bootstrap creates separate root and readWrite application users. MONGODB_URI must match MONGO_APP_USERNAME, MONGO_APP_PASSWORD, and MONGO_APP_DATABASE; its authSource is the application database. Root credentials remain for maintenance. Changing init variables on a populated volume does not rotate existing users. Retain the replica key and environment file securely across updates. This topology is for one server; it does not provide database redundancy.

```sh
docker compose --env-file /opt/wellness-tracker/.env.production \
  -f backend/docker-compose.prod.yml config --quiet
docker compose --env-file /opt/wellness-tracker/.env.production \
  -f backend/docker-compose.prod.yml up -d --build --wait
```

Do not print resolved Compose configuration into shared logs. Named mongo_data persists across restarts. The database is never published. The backend runs as a non-root user; readiness checks indexes and a writable primary.

## Explicit seeds

Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME, and ADMIN_TIMEZONE in the protected environment file. Then:

```sh
docker compose --env-file /opt/wellness-tracker/.env.production \
  -f backend/docker-compose.prod.yml --profile operations \
  run --rm --build tools npm run seed -- all
```

Use `rules`, `admin`, or `demo` instead of `all` to run a specific seed. `demo` creates three public member accounts with ninety days of sample history and the shared administrator. `all` also includes those demos. Public demo credentials are listed on the login page. Existing demo records and habit edits are preserved on repeat seeds. Rule seeds preserve existing enabled flags, values, and timestamps. They recreate missing defaults, including rules intentionally deleted through the UI, so do not run them on every update. Operator bootstrap creates or promotes the requested account, hides it from the leaderboard, and preserves the password of an existing account. No default production passwords are embedded. SHOW_DEMO_ACCOUNTS controls the login credential panel at build time and defaults to true. Set it to false and rebuild frontend to hide the panel; this does not remove seeded accounts.

The tooling container exits after the command and is outside the normal three-service runtime.

## Existing host Nginx

Generate a candidate include:

```sh
python3 backend/deploy/nginx/render-snippet.py \
  --env-file /opt/wellness-tracker/.env.production > /tmp/wellness-tracker.conf
```

Review it, include it inside the existing HTTPS server block, run `sudo nginx -t`, and reload only on success. The renderer substitutes routing settings and preserves Nginx variables. It does not install host configuration. A nested path is recommended on a shared VM. Root deployment requires ownership of the domain root and compatible existing locations.

The frontend build base, PUBLIC_BASE_PATH, cookie scope, and ingress prefix must agree. API traffic reaches Next at internal `/api/*`; static traffic reaches frontend `/`. Next has no basePath. Rebuild frontend when changing the prefix. APP_ORIGIN contains only the HTTPS origin, without the prefix or trailing slash.

Verify the public root, a deep client route, built JS/CSS assets, logo/favicon, `/api/health`, and `/api/health/ready` under the public prefix. Missing built assets must be 404. Test registration, login, saved data, logout, and operator authorization through HTTPS. Frontend responses include a same-origin content policy and other browser security headers.

## Backup and restore

Drain application traffic or stop the backend before backup when a consistent snapshot across collections is required. With writes stopped, create a protected archive outside the data volume:

```sh
sh backend/deploy/backup.sh /opt/wellness-tracker/.env.production \
  /opt/wellness-backups/wellness-2026-10-08.archive.gz
```

Create the destination directory first with restricted permissions. The command refuses to overwrite an existing file and removes incomplete archives. Database credentials stay inside the Mongo container environment and are not printed. Keep backup copies off the VM as appropriate and test recovery on a separate stack.

Restore only during planned downtime, with a fresh backup of current data:

```sh
docker compose --env-file /opt/wellness-tracker/.env.production \
  -f backend/docker-compose.prod.yml stop backend
sh backend/deploy/restore.sh /opt/wellness-tracker/.env.production \
  /opt/wellness-backups/wellness-2026-10-08.archive.gz --replace-database
docker compose --env-file /opt/wellness-tracker/.env.production \
  -f backend/docker-compose.prod.yml up -d --wait
```

Restore replaces collections present in the archive and is limited to MONGO_APP_DATABASE. Use a trusted archive from that application database. Authentication users remain separate. Verify readiness and saved data before reopening traffic. Never use `down -v` on the application stack unless intentionally deleting its database.

## Updates and local verification

Pull the intended revision, run checks and builds, create a consistent backup, rebuild Compose, verify readiness, and smoke-test the public subpath. Keep the previous revision available for application rollback; database changes need their own recovery plan. There are no destructive migrations in this version.

See `docs/local-testing.md` for the authenticated Docker simulation. Its additional temporary local gateway does not belong in VM production Compose. Local startup, subpath routing, real HTTP behavior, and a backup/restore round trip have passed. The project owner performs final local acceptance, configures the remote repository, and deploys to the VM.
