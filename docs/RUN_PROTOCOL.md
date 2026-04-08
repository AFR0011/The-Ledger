# Run Protocol

## Environment
- Host `npm` is not available.
- Use Docker with the `node:20` image for install, dev, test, and build commands.

## Commands

### Install
```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm install"
```

### Dev server
```powershell
docker run --rm -it -p 5173:5173 -v "${PWD}:/app" -w /app node:20 sh -lc "npm run dev -- --host 0.0.0.0"
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

## Manual Check List
- Start, resume, and finish one daily, one weekly, and one monthly entry.
- Refresh during an in-progress entry and confirm draft resume.
- Edit and delete a completed entry.
- Search and filter by text, type, domain tag, and state tag.
- Export a backup, then import it back into the app.
- Toggle theme and autosave settings.
- Install the PWA and confirm the app shell still opens offline.

