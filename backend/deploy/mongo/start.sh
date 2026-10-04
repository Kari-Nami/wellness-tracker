#!/bin/sh
set -eu
if [ -n "${MONGO_REPLICA_KEY:-}" ]; then
  umask 077
  printf '%s' "$MONGO_REPLICA_KEY" > /tmp/wellness-mongo.key
  chown mongodb:mongodb /tmp/wellness-mongo.key
  chmod 400 /tmp/wellness-mongo.key
  exec /usr/local/bin/docker-entrypoint.sh mongod --replSet rs0 --bind_ip_all --keyFile /tmp/wellness-mongo.key
fi
exec /usr/local/bin/docker-entrypoint.sh mongod --replSet rs0 --bind_ip_all
