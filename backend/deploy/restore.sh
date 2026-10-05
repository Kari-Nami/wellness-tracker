#!/bin/sh
set -eu
[ "$#" -eq 3 ] && [ "$3" = '--replace-database' ] || { echo 'Usage: restore.sh ENV_FILE ARCHIVE_PATH --replace-database' >&2; exit 2; }
env_file=$1
archive=$2
[ -r "$archive" ] || { echo 'Archive is not readable.' >&2; exit 1; }
compose_file=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/docker-compose.prod.yml
docker compose --env-file "$env_file" -f "$compose_file" exec -T mongo sh -c '
  exec mongorestore --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --nsInclude "$MONGO_APP_DATABASE.*" --drop --stopOnError --archive --gzip
' < "$archive"
echo 'Database restored. Restart the backend and verify readiness before reopening traffic.'
