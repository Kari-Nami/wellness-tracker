#!/bin/sh
set -eu
[ "$#" -eq 2 ] || { echo 'Usage: backup.sh ENV_FILE ARCHIVE_PATH' >&2; exit 2; }
env_file=$1
archive=$2
compose_file=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/docker-compose.prod.yml
umask 077
(set -C; : > "$archive") || { echo 'Archive already exists or cannot be created.' >&2; exit 1; }
trap 'rm -f -- "$archive"' EXIT HUP INT TERM
docker compose --env-file "$env_file" -f "$compose_file" exec -T mongo sh -c '
  exec mongodump --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db "$MONGO_APP_DATABASE" --archive --gzip
' > "$archive"
trap - EXIT HUP INT TERM
echo 'Protected database archive created.'
