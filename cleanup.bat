@echo off
REM Cleanup script for AI Character Prompt Generator (Windows)
REM Removes development artifacts and keeps only production-ready files

echo 🧹 Starting cleanup...
echo.

REM Remove development documentation
echo Removing development documentation...
del /Q AGENT_*.md 2>nul
del /Q AUDIT_*.md 2>nul
del /Q PHASE*.md 2>nul
del /Q PLAN_*.md 2>nul
del /Q IMPLEMENTATION_*.md 2>nul
del /Q TESTING_*.md 2>nul
del /Q UI_REDESIGN*.md 2>nul
del /Q CRITICAL_*.md 2>nul
del /Q COMPLETE_*.md 2>nul
del /Q ARCHITECTURE_*.md 2>nul
del /Q CODE_AUDIT*.md 2>nul
del /Q CHANGES.md 2>nul
del /Q CSS_*.md 2>nul
del /Q DEPLOYMENT_READY.md 2>nul
del /Q EXECUTION_*.md 2>nul
del /Q OLLAMA_*.md 2>nul
del /Q PROMPT_GENERATION*.md 2>nul
del /Q QUICK_FIXES*.md 2>nul
del /Q STAT_SYSTEM*.md 2>nul
del /Q "styles&angles.md" 2>nul
del /Q INTEGRATION_COMPLETE.md 2>nul
del /Q AI_ENHANCEMENT_GUIDE.md 2>nul
del /Q README_ELECTRON.md 2>nul
del /Q PRODUCTION_LAUNCH_READY.md 2>nul
del /Q FINAL_LAUNCH_COMPLETE.md 2>nul

REM Remove old/duplicate folders
echo Removing old folders...
rmdir /S /Q _old_python_app 2>nul
rmdir /S /Q AGENT_REPORTS 2>nul
rmdir /S /Q prompt-generator-electron 2>nul
rmdir /S /Q electron 2>nul
rmdir /S /Q .claude 2>nul

REM Remove sensitive files
echo Removing sensitive files...
del /Q .env 2>nul

REM Remove Windows-specific files
del /Q desktop.ini 2>nul
for /r %%i in (desktop.ini) do del "%%i" 2>nul

echo.
echo ✅ Cleanup complete!
echo.
echo 📁 Remaining files:
echo   - dist\          (production build)
echo   - src\           (source code)
echo   - public\        (data files)
echo   - package.json   (dependencies)
echo   - *.config.*     (configuration)
echo   - README.md      (documentation)
echo.
echo 🚀 Ready to deploy!
echo.
echo Next steps:
echo   1. npm run build
echo   2. Deploy dist\ folder to hosting
echo.
echo See DEPLOYMENT_GUIDE.md for deployment options.
echo.
pause
