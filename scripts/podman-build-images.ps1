$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

Write-Host "Building backend image..."
podman build -t pft-backend (Join-Path $root 'personal-finance-tracker-backend')

Write-Host "Building frontend image..."
podman build -t pft-frontend --build-arg VITE_API_BASE_URL=/api (Join-Path $root 'personal-finance-tracker-frontend')

Write-Host "Images rebuilt: pft-backend, pft-frontend"
