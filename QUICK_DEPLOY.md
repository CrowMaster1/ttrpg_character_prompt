# 🎯 Quick Deploy - TL;DR

## Desktop App (Recommended for Ollama Users)

**Windows:**
```bash
build-desktop.bat
```

**Output:** `release\AI Character Generator-2.1.0-Portable.exe`

✅ Ollama works perfectly (no CORS)
✅ Share the .exe file with your group
✅ Users just double-click to run

---

## GitHub Pages Website (For Public Access)

**First time setup:**
```bash
# 1. Create repo on GitHub
# 2. Link it
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/Promt-AI-Image-generator.git
git push -u origin main

# 3. Enable GitHub Pages in repo Settings → Pages → Source: gh-pages branch
```

**Deploy:**
```bash
deploy-github.bat
```

**Access:** `https://YOUR-USERNAME.github.io/Promt-AI-Image-generator/`

⚠️ Ollama requires CORS setup (app shows instructions)

---

## Do Both!

1. **Desktop app** for your working group (best Ollama experience)
2. **Website** for public demos and easy sharing

See **DEPLOY_OPTIONS.md** for detailed guide.
