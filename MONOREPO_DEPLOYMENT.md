# Mono-Repo Azure Deployment

This repository now deploys both apps from the same GitHub repository:

- `personal-finance-tracker-frontend` deploys to Azure Static Web Apps
- `personal-finance-tracker-backend` deploys to Azure App Service

GitHub Actions only reads workflow files from the repository root `.github/workflows` folder, so the old nested workflow files inside each app folder are not suitable for a shared mono-repo deployment.

## Workflows

- Frontend: `.github/workflows/azure-static-web-apps.yml`
- Backend: `.github/workflows/deploy-backend-app-service.yml`

Each workflow is scoped with `paths` filters:

- frontend pushes only trigger the Static Web Apps deployment
- backend pushes only trigger the App Service deployment
- changing both folders in one commit triggers both deployments from the same repository

## Required GitHub Secrets

Frontend Static Web Apps:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_POND_020D46F00`
- `VITE_API_BASE_URL`

Backend App Service:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

## Azure App Targets

- Static Web App app source: `personal-finance-tracker-frontend`
- Static Web App build output: `dist`
- App Service deploy package: published output from `personal-finance-tracker-backend`

## Notes

- Keep the frontend production API URL in the GitHub secret `VITE_API_BASE_URL` instead of relying on a checked-in `.env` file during CI.
- The backend workflow currently deploys to the Azure Web App named `personal-finance-tracker-backend`. Update `app-name` in `.github/workflows/deploy-backend-app-service.yml` if your real Azure resource name is different.
