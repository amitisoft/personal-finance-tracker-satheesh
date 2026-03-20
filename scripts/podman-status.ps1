$ErrorActionPreference = "Stop"

Write-Host "Containers"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""
Write-Host "Backend logs"
podman logs --tail 20 pft-backend
