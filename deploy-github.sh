#!/bin/bash

echo "========================================"
echo "Deploying to GitHub Pages"
echo "========================================"
echo ""

echo "[1/2] Building for GitHub Pages..."
npm run build:github
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi

echo ""
echo "[2/2] Deploying to GitHub Pages..."
echo ""
echo "This will push to the 'gh-pages' branch."
echo "Make sure you have committed your changes first!"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

npx gh-pages -d dist
if [ $? -ne 0 ]; then
    echo "ERROR: Deployment failed!"
    echo ""
    echo "Common issues:"
    echo "- Not logged into GitHub"
    echo "- No git repository configured"
    echo "- No permission to push"
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "SUCCESS! Deployed to GitHub Pages"
echo "========================================"
echo ""
echo "Your site will be available at:"
echo "https://YOUR-USERNAME.github.io/Promt-AI-Image-generator/"
echo ""
echo "Note: First deployment may take a few minutes to go live."
echo "Enable GitHub Pages in repo Settings if needed."
echo ""
