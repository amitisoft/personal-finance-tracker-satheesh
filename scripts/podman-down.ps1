$ErrorActionPreference = "Stop"

$containers = @("pft-frontend", "pft-backend", "pft-postgres")

foreach ($name in $containers) {
  $exists = podman ps -a --format "{{.Names}}" | Where-Object { $_ -eq $name }
  if ($exists) {
    podman rm -f $name | Out-Null
  }
}

Write-Host "Stopped and removed: $($containers -join ', ')"
