@echo off
echo ========================================
echo Building Portable Desktop App
echo ========================================
echo.

echo [1/2] Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Creating portable executable...
call npm run electron:build:portable
if errorlevel 1 (
    echo ERROR: Electron build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Desktop app built.
echo ========================================
echo.
echo Output: release\AI Character Generator-2.1.0-Portable.exe
echo.
echo You can now distribute this file to users.
echo No installation required - just run it!
echo.
pause
