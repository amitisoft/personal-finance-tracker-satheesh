# Personal Finance Tracker Backend

ASP.NET Core 8 Web API for the personal finance tracker.

## Local development

1. Ensure PostgreSQL is running.
2. Restore and build:

```powershell
$env:DOTNET_CLI_HOME="$(Join-Path $PWD '.dotnet-cli')"
$env:HOME=$env:DOTNET_CLI_HOME
& "$env:ProgramFiles\dotnet\dotnet.exe" restore PersonalFinance.sln
& "$env:ProgramFiles\dotnet\dotnet.exe" build PersonalFinance.sln
```

3. Apply migrations:

```powershell
$env:DOTNET_CLI_HOME="$(Join-Path $PWD '.dotnet-cli')"
$env:HOME=$env:DOTNET_CLI_HOME
& "$env:ProgramFiles\dotnet\dotnet.exe" tool restore
& "$env:ProgramFiles\dotnet\dotnet.exe" tool run dotnet-ef database update --project src/PersonalFinance.Infrastructure/PersonalFinance.Infrastructure.csproj --startup-project src/PersonalFinance.Api/PersonalFinance.Api.csproj
```

4. Run the API:

```powershell
Get-Content .env.example | ForEach-Object {
  if ($_ -match '^(.*?)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') }
}
& "$env:ProgramFiles\dotnet\dotnet.exe" run --project src/PersonalFinance.Api/PersonalFinance.Api.csproj
```

## Podman

Build the image:

```powershell
podman build -t pft-backend .
```

The recommended runtime flow for this repository is from the project root:

```powershell
D:\personal-finance-tracker\scripts\podman-up.ps1
```

That starts PostgreSQL, the backend, and the frontend on one Podman network and lets the backend run migrations at startup.
