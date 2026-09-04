# Run Protocol

## Environment
- Use Node 20.19 or newer within the Node 20 line and npm with the committed lockfile.
- If Docker Desktop is not running and PowerShell blocks `npm.ps1`, use `npm.cmd` as the host fallback.

## Commands

### Install
```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm ci"
```

### Dev server
```powershell
docker run --rm -it -p 5173:5173 -v "${PWD}:/app" -w /app node:20 sh -lc "npm run dev -- --host 0.0.0.0"
```

### Existing long-lived dev server
```powershell
docker ps --filter "name=the-ledger-dev"
```

If you want the dev server to stay open between sessions:

```powershell
docker run -d --name the-ledger-dev -p 5173:5173 -v "${PWD}:/app" -w /app node:20 sh -lc "npm run dev -- --host 0.0.0.0"
```

If the shell looks stale after long-running sessions or PWA-shell changes, restart it before debugging UI output:

```powershell
docker rm -f the-ledger-dev
docker run -d --name the-ledger-dev -p 5173:5173 -v "${PWD}:/app" -w /app node:20 sh -lc "npm run dev -- --host 0.0.0.0"
```

### Lint
```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run lint"
```

### Test
```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run test"
```

### Build
```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run build"
```

### Complete static gate
```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm ci && npm run check"
```

### Browser trust paths
```powershell
npx playwright install chromium
npm run test:e2e
```

### Host fallback
```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run audit:prod
npm.cmd run audit
```

## Manual Check List
- Start, resume, and finish one daily, one weekly, and one monthly entry.
- Refresh during an in-progress entry and confirm draft resume.
- Edit and delete a completed entry.
- Search and filter by text, type, domain tag, and state tag.
- Open Review, track a next step as a commitment, then mark it done, carried, and dropped across separate commitments.
- Open Threads and confirm repeated domain tags, state tags, and current-thread answers group the expected entries.
- Export a backup, then import it back into the app.
- Toggle theme and autosave settings.
- Confirm the header or Settings surface exposes an install action once the browser allows it.
- Install the PWA and relaunch it from the installed shell.
- While online, verify the offline-ready banner appears after the service worker is cached.
- Turn the network off and confirm the installed shell still opens, entries remain visible, and local edits still persist in the same browser profile.
- Reconnect and confirm update/offline banners behave normally again.

## Verification Notes
- A transient Playwright container has already exercised the mobile/offline regression path against the live dev server: Home, history filtering, detail insight context, theme toggle, backup export/import, offline reopen, and offline edit/save.
- Explicit install-prompt acceptance still needs a normal interactive browser because `beforeinstallprompt` behavior is browser-policy dependent and not reliable in headless automation.

## Offline Limits
- The offline shell caches app assets, not cross-device data.
- Ledger data remains in browser `localStorage`; clearing browser storage removes entries and drafts even if the shell is still installed.
- The first successful online load is required before the shell can relaunch offline.
