# Personal Finance Tracker Frontend

Vite + React + TypeScript frontend for the personal finance tracker.

## Environment files

All frontend environments should point to the live backend API through `/api`:

```env
VITE_API_BASE_URL=/api
```

The frontend is built as static files, so `VITE_*` values are compiled at build time.
Changing API targets requires rebuilding the frontend image.

## Local development

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## API routing in deployment

The frontend container is served by Nginx using [`nginx.conf`](./nginx.conf).
Requests to `/api/` are proxied to the backend container:

```nginx
location /api/ {
  proxy_pass http://pft-backend:8080/api/;
}
```

## Podman deployment

From the project root `D:\personal-finance-tracker`:

Build both images:

```powershell
.\scripts\podman-build-images.ps1
```

Bring up the full stack:

```powershell
.\scripts\podman-up.ps1
```

Rebuild and restart everything:

```powershell
.\scripts\podman-rebuild.ps1
```

Frontend URL:
- http://localhost:8088

## Notes

- This is a static frontend build served by Nginx.
- The Nginx config includes SPA fallback, so routes like `/dashboard` and `/transactions` work directly.
- This frontend now uses only the live backend API and no local mock mode.
