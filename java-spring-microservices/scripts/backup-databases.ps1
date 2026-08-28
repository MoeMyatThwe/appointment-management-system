param(
  [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T `
  -e "PGPASSWORD=$env:POSTGRES_PASSWORD" auth-service-db `
  pg_dump -U admin_user -d auth-service-db --format=custom `
  > (Join-Path $BackupDir "auth-service-db-$timestamp.dump")

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T `
  -e "PGPASSWORD=$env:POSTGRES_PASSWORD" appointment-service-db `
  pg_dump -U admin_user -d appointment-service-db --format=custom `
  > (Join-Path $BackupDir "appointment-service-db-$timestamp.dump")

Write-Output "Backups written to $BackupDir"
