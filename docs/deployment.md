# Deployment scaffold

Production consists of frontend, backend, and authenticated MongoDB containers. MongoDB runs as a single-member `rs0` replica set so related check-in and scoring writes can commit in one transaction. Only frontend/backend ports are published, bound to loopback. The existing VM Nginx and Certbot provide public ingress and HTTPS. No Compose service owns ports 80 or 443 on the host.

## Build and start

Keep frontend and backend as sibling checkouts. Copy `backend/.env.production.example` to a protected environment file outside both checkouts, set real values, and restrict permissions with `chmod 600`. Generate and retain `MONGO_REPLICA_KEY` with `openssl rand -base64 756`. The MongoDB service writes this protected key inside its container and initializes its replica set once; health checks require a writable primary. Keep the key stable across updates. The backend connection credentials must match Mongo credentials; percent-encode any URI-reserved characters. The example uses a Mongo root user for initial bootstrap. Before VM deployment, prefer a dedicated least-privilege application user; seed/operations can retain separate admin credentials.

```sh
docker compose --env-file /opt/wellness-tracker/.env.production \
  -f backend/docker-compose.prod.yml config --quiet
docker compose --env-file /opt/wellness-tracker/.env.production \
  -f backend/docker-compose.prod.yml up -d --build
```

Do not print resolved Compose configuration with production secrets to a shared log. Named `mongo_data` persists across restarts. Changing init credentials after initialization does not reset the MongoDB user in an existing volume.

## Host Nginx

Generate a candidate snippet:

```sh
python3 backend/deploy/nginx/render-snippet.py \
  --env-file /opt/wellness-tracker/.env.production > /tmp/wellness-tracker.conf
```

The script substitutes only base-path and port settings and preserves Nginx variables. Review the candidate, install it as an include inside the existing HTTPS server block, run `sudo nginx -t`, and reload only on success. No host configuration is installed by this scaffold.

A non-root base path is recommended on the shared VM. A root deployment is supported by the renderer but requires explicit ownership of the domain root and compatible existing Nginx locations.

Verify the public base root, a deep route such as calendar, one built JS/CSS asset, `/api/health`, and `/api/health/ready` beneath the configured public prefix. API traffic must reach Next at internal `/api/*`; static traffic reaches the frontend at `/`. Missing built assets must be 404, never the SPA HTML fallback. The current product endpoints return 501 until the assigned backend developer completes them.

## Local Docker simulation

Use a separate env file, project name, and unused loopback ports so checks do not affect an existing stack. The production Compose file builds the real images; it requires a public gateway for combined browser/API routing. For smoke checks, a disposable local Nginx container can simulate host ingress using the rendered snippet and Docker service names instead of loopback upstreams. This test-only gateway does not belong in the VM production Compose topology. Full session acceptance should use localhost consistently or a local HTTPS origin matching APP_ORIGIN.

## Backup and update

Use `mongodump --archive --gzip` against the authenticated Mongo service and retain a protected copy outside its data volume. Have the backend/operations developer document credential-safe backup/restore commands before deployment. Never use `down -v` on the real application stack unless intentionally deleting its database. Pull both checkouts, run checks/builds, rebuild Compose, check readiness, and smoke-test the public subpath before considering an update complete.

The frontend is implemented and reviewed. Production release still requires backend implementation, real cookie/authorization checks, complete-stack integration, and owner acceptance.
