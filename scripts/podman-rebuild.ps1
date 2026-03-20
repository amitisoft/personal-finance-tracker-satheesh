$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'podman-down.ps1')
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'podman-build-images.ps1')
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'podman-up.ps1')
