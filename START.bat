@echo off
echo ========================================
echo  AI Character Generator - Local Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This may take a few minutes on first run.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo Make sure Node.js is installed: https://nodejs.org
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo Starting local development server...
echo.
echo The app will open at: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the dev server
call npm run dev

REM If the server stops, pause so user can see any errors
if errorlevel 1 (
    echo.
    echo Server stopped with an error.
    pause
)
