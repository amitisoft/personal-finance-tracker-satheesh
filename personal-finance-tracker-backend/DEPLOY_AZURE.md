# Deploy Backend to Azure

This backend is a good fit for:

- Azure App Service for Containers
- Azure Database for PostgreSQL Flexible Server

The repo already includes a `Containerfile`, exposes port `8080`, and supports configuration through environment variables, which works well with Azure App Service.

## 1. Prerequisites

- Azure subscription
- Azure CLI installed
- Docker or Podman installed locally
- A strong JWT secret ready
- Your frontend production URL ready for CORS

## 2. Create Azure resources

Example resource names:

- Resource group: `pft-rg`
- App Service plan: `pft-plan`
- Web app: `pft-backend-api`
- Container registry: `pftregistry`
- PostgreSQL server: `pft-postgres`
- Database: `personal_finance`

Create the resource group:

```powershell
az group create --name pft-rg --location centralindia
```

Create Azure Container Registry:

```powershell
az acr create --resource-group pft-rg --name pftregistry --sku Basic
az acr login --name pftregistry
```

Create PostgreSQL Flexible Server:

```powershell
az postgres flexible-server create `
  --resource-group pft-rg `
  --name pft-postgres `
  --location centralindia `
  --admin-user pftadmin `
  --admin-password "<strong-password>" `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --version 16 `
  --storage-size 32 `
  --public-access 0.0.0.0
```

Create the app database:

```powershell
az postgres flexible-server db create `
  --resource-group pft-rg `
  --server-name pft-postgres `
  --database-name personal_finance
```

Allow Azure services to reach PostgreSQL if needed:

```powershell
az postgres flexible-server firewall-rule create `
  --resource-group pft-rg `
  --name pft-postgres `
  --rule-name allow-azure-services `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

## 3. Build and push the backend image

Build the image:

```powershell
docker build -t pftregistry.azurecr.io/pft-backend:latest -f Containerfile .
```

Push the image:

```powershell
docker push pftregistry.azurecr.io/pft-backend:latest
```

## 4. Create the App Service plan and Web App

Create a Linux App Service plan:

```powershell
az appservice plan create `
  --name pft-plan `
  --resource-group pft-rg `
  --is-linux `
  --sku B1
```

Create the Web App using the container image:

```powershell
az webapp create `
  --resource-group pft-rg `
  --plan pft-plan `
  --name pft-backend-api `
  --deployment-container-image-name pftregistry.azurecr.io/pft-backend:latest
```

Connect App Service to ACR:

```powershell
az webapp config container set `
  --name pft-backend-api `
  --resource-group pft-rg `
  --container-image-name pftregistry.azurecr.io/pft-backend:latest `
  --container-registry-url https://pftregistry.azurecr.io
```

Enable managed identity and grant AcrPull:

```powershell
$principalId = az webapp identity assign `
  --name pft-backend-api `
  --resource-group pft-rg `
  --query principalId -o tsv

$acrId = az acr show `
  --name pftregistry `
  --resource-group pft-rg `
  --query id -o tsv

az role assignment create `
  --assignee $principalId `
  --scope $acrId `
  --role AcrPull
```

## 5. Configure application settings

Set these App Service settings:

```powershell
az webapp config appsettings set `
  --name pft-backend-api `
  --resource-group pft-rg `
  --settings `
    ASPNETCORE_ENVIRONMENT=Production `
    ASPNETCORE_URLS=http://+:8080 `
    WEBSITES_PORT=8080 `
    ConnectionStrings__DefaultConnection="Host=pft-postgres.postgres.database.azure.com;Port=5432;Database=personal_finance;Username=pftadmin;Password=<strong-password>;SSL Mode=Require;Trust Server Certificate=true" `
    Jwt__Issuer=pft-api `
    Jwt__Audience=pft-frontend `
    Jwt__Secret="<long-random-secret-at-least-32-characters>" `
    Jwt__AccessTokenMinutes=15 `
    Jwt__RefreshTokenDays=7 `
    Cors__AllowedOrigins__0="https://your-frontend-domain" `
    Database__ApplyMigrationsOnStartup=true
```

Notes:

- `WEBSITES_PORT=8080` is required because the container listens on port `8080`.
- Use your real frontend domain in `Cors__AllowedOrigins__0`.
- Do not keep secrets in `appsettings.json`; store them in Azure App Service settings.
- If you have multiple frontend domains, continue with `Cors__AllowedOrigins__1`, `Cors__AllowedOrigins__2`, and so on.

## 6. Restart and verify

Restart the app:

```powershell
az webapp restart --name pft-backend-api --resource-group pft-rg
```

Check logs:

```powershell
az webapp log tail --name pft-backend-api --resource-group pft-rg
```

Health check:

```powershell
curl https://pft-backend-api.azurewebsites.net/health
```

## 7. Recommended Azure portal settings

In App Service:

- Turn on `HTTPS Only`
- Add a Health check path: `/health`
- Set `Always On` if your pricing tier supports it
- Configure a custom domain later if needed

## 8. Database migration behavior

This app already runs EF Core migrations at startup when:

```text
Database__ApplyMigrationsOnStartup=true
```

That means the container can create or update the schema automatically during deployment.

For production, this is acceptable for a small project. For stricter production control later, you can disable startup migrations and run them in a release step instead.

## 9. What was required for this repo

The main required changes for safe Azure deployment were:

- remove real credentials from tracked config files
- keep secrets in Azure App Service settings instead
- keep production CORS origins configurable

## 10. Important security follow-up

Because a real database password was present in tracked files before this update, you should:

1. Rotate the PostgreSQL password in Azure immediately.
2. Replace any leaked JWT secret if it was ever used in production.
3. Review git history if this repository has been pushed to GitHub or shared elsewhere.
