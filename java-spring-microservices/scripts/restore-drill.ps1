param(
  [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"
$authDump = Get-ChildItem (Join-Path $BackupDir "auth-service-db-*.dump") |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
$appointmentDump = Get-ChildItem (Join-Path $BackupDir "appointment-service-db-*.dump") |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($null -eq $authDump -or $null -eq $appointmentDump) {
  throw "Both database backup files are required."
}

$suffix = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$authDb = "restore_drill_auth_$suffix"
$appointmentDb = "restore_drill_appointment_$suffix"
$composeArgs = @("-f", "docker-compose.yml", "-f", "docker-compose.prod.yml")

try {
  docker compose @composeArgs exec -T auth-service-db createdb -U admin_user $authDb
  docker compose @composeArgs exec -T appointment-service-db createdb -U admin_user $appointmentDb
  Get-Content $authDump.FullName -AsByteStream |
    docker compose @composeArgs exec -T -e "PGPASSWORD=$env:POSTGRES_PASSWORD" auth-service-db `
      pg_restore -U admin_user -d $authDb --exit-on-error
  Get-Content $appointmentDump.FullName -AsByteStream |
    docker compose @composeArgs exec -T -e "PGPASSWORD=$env:POSTGRES_PASSWORD" appointment-service-db `
      pg_restore -U admin_user -d $appointmentDb --exit-on-error
  Write-Output "Restore drill passed."
}
finally {
  docker compose @composeArgs exec -T auth-service-db dropdb -U admin_user --if-exists $authDb
  docker compose @composeArgs exec -T appointment-service-db dropdb -U admin_user --if-exists $appointmentDb
}
