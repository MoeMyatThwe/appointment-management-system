#!/usr/bin/env sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
auth_dump="$(ls -t "$backup_dir"/auth-service-db-*.dump | head -n 1)"
appointment_dump="$(ls -t "$backup_dir"/appointment-service-db-*.dump | head -n 1)"
compose="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

auth_db="restore_drill_auth_$timestamp"
appointment_db="restore_drill_appointment_$timestamp"

cleanup() {
  $compose exec -T auth-service-db dropdb -U admin_user --if-exists "$auth_db" >/dev/null
  $compose exec -T appointment-service-db dropdb -U admin_user --if-exists "$appointment_db" >/dev/null
}
trap cleanup EXIT

$compose exec -T auth-service-db createdb -U admin_user "$auth_db"
$compose exec -T appointment-service-db createdb -U admin_user "$appointment_db"
$compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" auth-service-db \
  pg_restore -U admin_user -d "$auth_db" --exit-on-error < "$auth_dump"
$compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" appointment-service-db \
  pg_restore -U admin_user -d "$appointment_db" --exit-on-error < "$appointment_dump"

echo "Restore drill passed for $auth_dump and $appointment_dump"
