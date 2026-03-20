# Database Files

- `schema.sql` is the reference SQL schema.
- `seed.sql` is an optional manual SQL seed file and does not contain demo users.
- `.env.postgres` contains PostgreSQL container variables.

## Podman PostgreSQL

From the project root, use:

```powershell
D:\personal-finance-tracker\scripts\podman-up.ps1
```

That starts PostgreSQL as `pft-postgres` on the shared `pft-net` network with the values from `.env.postgres`.

## Apply EF migrations

Migrations are applied automatically by the backend container on startup because:

- `Database__ApplyMigrationsOnStartup=true`

If you still want to run them manually from `personal-finance-tracker-backend`:

```powershell
$env:DOTNET_CLI_HOME="$(Join-Path $PWD '.dotnet-cli')"
$env:HOME=$env:DOTNET_CLI_HOME
& "$env:ProgramFiles\dotnet\dotnet.exe" tool restore
& "$env:ProgramFiles\dotnet\dotnet.exe" tool run dotnet-ef database update --project src/PersonalFinance.Infrastructure/PersonalFinance.Infrastructure.csproj --startup-project src/PersonalFinance.Api/PersonalFinance.Api.csproj
```
