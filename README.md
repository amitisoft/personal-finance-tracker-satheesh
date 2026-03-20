# Personal Finance Tracker

## Podman startup

This machine does not currently have a working `podman compose` provider, so use the helper scripts from the root `D:\personal-finance-tracker` folder.

First, Open PowerShell and clone the repository:
git clone https://github.com/satheesh-amiti/personal-finance-tracker.git

Then navigate to the project directory:
`cd personal-finance-tracker`

## 🐳 Podman Setup (Required)

Before building and running the application, make sure the Podman virtual machine is initialized and started.

Run the following commands:

```bash
podman machine init
podman machine start
```

### Build images

Build both images:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\podman-build-images.ps1
```

### Start the stack

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\podman-up.ps1
```

Services:
- frontend: http://localhost:8088

### Check status

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\podman-status.ps1
```

### Stop the stack

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\podman-down.ps1
```

### Rebuild images
Stop containers, rebuild images, and start the full stack again:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\podman-rebuild.ps1
```
