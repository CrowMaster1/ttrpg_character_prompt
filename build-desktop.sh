#!/bin/bash

echo "========================================"
echo "Building Portable Desktop App"
echo "========================================"
echo ""

echo "[1/2] Building production bundle..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi

echo ""
echo "[2/2] Creating portable executable..."
npm run electron:build:portable
if [ $? -ne 0 ]; then
    echo "ERROR: Electron build failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "SUCCESS! Desktop app built."
echo "========================================"
echo ""
echo "Output: release/AI Character Generator-2.1.0-*.AppImage (or .zip for Mac)"
echo ""
echo "You can now distribute this file to users."
echo "No installation required!"
echo ""
