@echo off
echo ========================================
echo Deploying to GitHub Pages
echo ========================================
echo.

echo [1/2] Building for GitHub Pages...
call npm run build:github
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Deploying to GitHub Pages...
echo.
echo This will push to the 'gh-pages' branch.
echo Make sure you have committed your changes first!
echo.
pause

call npx gh-pages -d dist
if errorlevel 1 (
    echo ERROR: Deployment failed!
    echo.
    echo Common issues:
    echo - Not logged into GitHub
    echo - No git repository configured
    echo - No permission to push
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Deployed to GitHub Pages
echo ========================================
echo.
echo Your site will be available at:
echo https://YOUR-USERNAME.github.io/Promt-AI-Image-generator/
echo.
echo Note: First deployment may take a few minutes to go live.
echo Enable GitHub Pages in repo Settings if needed.
echo.
pause
