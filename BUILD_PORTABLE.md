# 🚀 Build Portable Desktop App

Quick guide to building the portable desktop application.

## Prerequisites

- Node.js installed
- Dependencies installed (`npm install`)
- Built production files (`npm run build`)

## Quick Build

### Build for Your Platform (Fastest)

```bash
npm run electron:build:portable
```

**Output:**
- Windows: `release/AI Character Generator-2.1.0-Portable.exe` (~120MB)
- Mac: `release/AI Character Generator-2.1.0-mac-x64.zip` (~150MB)
- Linux: `release/AI Character Generator-2.1.0-linux-x64.AppImage` (~130MB)

### Build All Platforms

```bash
npm run electron:build:all
```

**Output:**
- `AI Character Generator-2.1.0-Portable.exe` (Windows portable)
- `AI Character Generator-2.1.0-win-x64.zip` (Windows archive)
- `AI Character Generator-2.1.0-mac-x64.zip` (Mac Intel)
- `AI Character Generator-2.1.0-mac-arm64.zip` (Mac Apple Silicon)
- `AI Character Generator-2.1.0-linux-x64.AppImage` (Linux portable)
- `AI Character Generator-2.1.0-linux-x64.tar.gz` (Linux archive)

## Development Mode

Test the desktop app with hot reload:

```bash
npm run electron:dev
```

This runs both:
1. Vite dev server (localhost:5173)
2. Electron window pointing to dev server

## Build Time

First build: ~2-5 minutes (downloads dependencies)
Subsequent builds: ~30-60 seconds

## Customization

### Add Custom Icons

Place icons in `assets/` folder:
- `icon.ico` - Windows (256x256)
- `icon.icns` - Mac
- `icon.png` - Linux (512x512)

See `assets/README.md` for icon generation tools.

### Change Version

Edit `package.json`:
```json
{
  "version": "2.1.0"
}
```

## Distribution

### Windows
1. Share `AI Character Generator-2.1.0-Portable.exe`
2. Users double-click to run (no installation)
3. Works with local Ollama automatically

### Mac
1. Share `.zip` file
2. Users extract and drag to Applications (or anywhere)
3. First run: Right-click → Open

### Linux
1. Share `.AppImage` file
2. Users: `chmod +x *.AppImage && ./AI*.AppImage`
3. Or use `.tar.gz` for manual extraction

## Troubleshooting

### Build Fails

**Clear cache and retry:**
```bash
rm -rf node_modules release dist
npm install
npm run build
npm run electron:build:portable
```

### Icon Errors

Build will use default Electron icon if custom icons are missing. This is fine for testing.

### Large File Size

Normal! Electron bundles:
- Chromium (~100MB)
- Node.js (~20MB)
- Your app (~10MB)

This is standard for Electron apps (VS Code, Discord, Slack all ~100-150MB).

## File Structure After Build

```
release/
├── AI Character Generator-2.1.0-Portable.exe    # Ready to distribute!
├── AI Character Generator-2.1.0-win-x64.zip
├── builder-debug.yml
└── builder-effective-config.yaml
```

## Next Steps

1. ✅ Build portable app: `npm run electron:build:portable`
2. ✅ Test it: Double-click the .exe
3. ✅ Verify Ollama connection works
4. ✅ Share with users!

---

**Ready to build!** Run `npm run electron:build:portable` to create your portable executable.
