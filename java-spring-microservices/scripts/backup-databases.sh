#!/usr/bin/env sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T \
  -e PGPASSWORD="$POSTGRES_PASSWORD" auth-service-db \
  pg_dump -U admin_user -d auth-service-db --format=custom \
  > "$backup_dir/auth-service-db-$timestamp.dump"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T \
  -e PGPASSWORD="$POSTGRES_PASSWORD" appointment-service-db \
  pg_dump -U admin_user -d appointment-service-db --format=custom \
  > "$backup_dir/appointment-service-db-$timestamp.dump"

echo "Backups written to $backup_dir"
