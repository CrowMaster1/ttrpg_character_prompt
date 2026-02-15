# App Icons

Place application icons here for desktop builds:

## Required Icons

### Windows
- `icon.ico` - 256x256 icon file
  - Create at: https://www.icoconverter.com/

### Mac
- `icon.icns` - Mac icon set
  - Create at: https://cloudconvert.com/png-to-icns

### Linux
- `icon.png` - 512x512 PNG image

## Quick Icon Generation

If you don't have icons, electron-builder will use a default Electron icon.

To create professional icons from a single PNG:

1. Create a 1024x1024 PNG image with your logo
2. Use online tools:
   - Windows ICO: https://www.icoconverter.com/
   - Mac ICNS: https://cloudconvert.com/png-to-icns
   - Linux: Just resize to 512x512

3. Place the generated files here:
   ```
   assets/
   ├── icon.ico   (Windows)
   ├── icon.icns  (Mac)
   └── icon.png   (Linux)
   ```

## Current Status

No icons provided - builds will use default Electron icon.
Add your custom icons to this folder and rebuild.
