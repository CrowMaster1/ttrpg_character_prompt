#!/bin/bash

# Cleanup script for AI Character Prompt Generator
# Removes development artifacts and keeps only production-ready files

echo "🧹 Starting cleanup..."

# Remove development documentation
echo "Removing development documentation..."
rm -f AGENT_*.md
rm -f AUDIT_*.md
rm -f PHASE*.md
rm -f PLAN_*.md
rm -f IMPLEMENTATION_*.md
rm -f TESTING_*.md
rm -f UI_REDESIGN*.md
rm -f CRITICAL_*.md
rm -f COMPLETE_*.md
rm -f ARCHITECTURE_*.md
rm -f CODE_AUDIT*.md
rm -f CHANGES.md
rm -f CSS_*.md
rm -f DEPLOYMENT_READY.md
rm -f EXECUTION_*.md
rm -f OLLAMA_*.md
rm -f PROMPT_GENERATION*.md
rm -f QUICK_FIXES*.md
rm -f STAT_SYSTEM*.md
rm -f "styles&angles.md"
rm -f INTEGRATION_COMPLETE.md
rm -f AI_ENHANCEMENT_GUIDE.md
rm -f README_ELECTRON.md
rm -f PRODUCTION_LAUNCH_READY.md
rm -f FINAL_LAUNCH_COMPLETE.md

# Remove old/duplicate folders
echo "Removing old folders..."
rm -rf _old_python_app
rm -rf AGENT_REPORTS
rm -rf prompt-generator-electron
rm -rf electron
rm -rf .claude

# Remove sensitive files
echo "Removing sensitive files..."
rm -f .env

# Remove Windows-specific files (if any)
rm -f desktop.ini
find . -name "desktop.ini" -type f -delete 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "📁 Remaining files:"
echo "  - dist/          (production build)"
echo "  - src/           (source code)"
echo "  - public/        (data files)"
echo "  - package.json   (dependencies)"
echo "  - *.config.*     (configuration)"
echo "  - README.md      (documentation)"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Next steps:"
echo "  1. npm run build"
echo "  2. Deploy dist/ folder to hosting"
echo ""
echo "See DEPLOYMENT_GUIDE.md for deployment options."
