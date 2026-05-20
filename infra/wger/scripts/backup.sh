#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"

mkdir -p "$BACKUP_DIR"
cd "$ROOT_DIR"

docker compose exec -T db pg_dump --username "${POSTGRES_USER:-wger}" --dbname "${POSTGRES_DB:-wger}" \
  | gzip > "$BACKUP_DIR/wger-postgres-$STAMP.sql.gz"

docker run --rm \
  -v stryv-wger-media:/media:ro \
  -v "$BACKUP_DIR:/backup" \
  alpine tar -czf "/backup/wger-media-$STAMP.tgz" -C /media .

echo "Created:"
echo "$BACKUP_DIR/wger-postgres-$STAMP.sql.gz"
echo "$BACKUP_DIR/wger-media-$STAMP.tgz"
