$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dbEnv = Join-Path $root "db\.env.postgres"
$backendEnv = Join-Path $root "personal-finance-tracker-backend\.env.production"

if (-not (Test-Path $dbEnv)) {
  throw "Missing db env file: $dbEnv"
}

if (-not (Test-Path $backendEnv)) {
  throw "Missing backend env file: $backendEnv"
}

$networkExists = podman network ls --format "{{.Name}}" | Where-Object { $_ -eq "pft-net" }
if (-not $networkExists) {
  podman network create pft-net | Out-Null
}

$volumeExists = podman volume ls --format "{{.Name}}" | Where-Object { $_ -eq "pft-postgres-data" }
if (-not $volumeExists) {
  podman volume create pft-postgres-data | Out-Null
}

$postgresExists = podman ps -a --format "{{.Names}}" | Where-Object { $_ -eq "pft-postgres" }
if (-not $postgresExists) {
  podman run -d --name pft-postgres --network pft-net --env-file $dbEnv -p 5432:5432 -v pft-postgres-data:/var/lib/postgresql/data docker.io/postgres:16-alpine | Out-Null
} else {
  $running = podman ps --format "{{.Names}}" | Where-Object { $_ -eq "pft-postgres" }
  if (-not $running) {
    podman start pft-postgres | Out-Null
  }
}

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    podman exec pft-postgres pg_isready -U pft_user -d pft | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

if (-not $ready) {
  throw "PostgreSQL did not become ready in time."
}

$backendExists = podman ps -a --format "{{.Names}}" | Where-Object { $_ -eq "pft-backend" }
if (-not $backendExists) {
  podman run -d --name pft-backend --network pft-net --env-file $backendEnv -p 8080:8080 localhost/pft-backend:latest | Out-Null
} else {
  $running = podman ps --format "{{.Names}}" | Where-Object { $_ -eq "pft-backend" }
  if (-not $running) {
    podman start pft-backend | Out-Null
  }
}

$frontendExists = podman ps -a --format "{{.Names}}" | Where-Object { $_ -eq "pft-frontend" }
if (-not $frontendExists) {
  podman run -d --name pft-frontend --network pft-net -p 8088:80 localhost/pft-frontend:latest | Out-Null
} else {
  $running = podman ps --format "{{.Names}}" | Where-Object { $_ -eq "pft-frontend" }
  if (-not $running) {
    podman start pft-frontend | Out-Null
  }
}

Write-Host "Stack is up:"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""
Write-Host "Frontend: http://localhost:8088"
Write-Host "Backend:  http://localhost:8080"
Write-Host "Register a user from the frontend before logging in."
