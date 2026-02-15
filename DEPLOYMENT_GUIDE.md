# 🚀 Deployment Guide - AI Character Prompt Generator

This guide covers building and deploying the app as a **portable desktop application** or website.

## 🎯 Recommended: Portable Desktop App

**Best choice for Ollama integration** - Zero configuration, works with local Ollama instance automatically.

---

## Option 1: Portable Desktop App (⭐ RECOMMENDED)

Build a standalone executable that requires **no installation** - perfect for Ollama users.

### Quick Start

```bash
# Build portable app for your platform
npm run electron:build:portable

# Or build for all platforms
npm run electron:build:all
```

### What You Get

| Platform | Output | Size | Ollama Support |
|----------|--------|------|----------------|
| **Windows** | `AI Character Generator-2.1.0-Portable.exe` | ~120MB | ✅ Perfect |
| **Mac** | `AI Character Generator-2.1.0-mac-x64.zip` | ~150MB | ✅ Perfect |
| **Linux** | `AI Character Generator-2.1.0-linux-x64.AppImage` | ~130MB | ✅ Perfect |

### Features

✅ **Single file** - No installation required
✅ **Portable** - Run from USB drive or any folder
✅ **Ollama ready** - Connects to `localhost:11434` automatically
✅ **No CORS issues** - Desktop app bypasses browser restrictions
✅ **Offline capable** - All data files bundled
✅ **Auto-updates ready** - Built-in update mechanism

### Build Commands

```bash
# Development mode (hot reload)
npm run electron:dev

# Build portable version (single platform)
npm run electron:build:portable

# Build all formats (Windows, Mac, Linux)
npm run electron:build:all

# Build installer version (optional)
npm run electron:build
```

### Output Files

Builds are created in the `release/` folder:

```
release/
├── AI Character Generator-2.1.0-Portable.exe        # Windows (no install)
├── AI Character Generator-2.1.0-win-x64.zip         # Windows (extract & run)
├── AI Character Generator-2.1.0-mac-x64.zip         # Mac (Intel)
├── AI Character Generator-2.1.0-mac-arm64.zip       # Mac (Apple Silicon)
├── AI Character Generator-2.1.0-linux-x64.AppImage  # Linux (portable)
└── AI Character Generator-2.1.0-linux-x64.tar.gz    # Linux (archive)
```

### Distribution

**Windows Users:**
1. Download `AI Character Generator-2.1.0-Portable.exe`
2. Double-click to run (no installation)
3. Start Ollama Desktop
4. AI features work automatically

**Mac Users:**
1. Download and extract `.zip`
2. Drag `AI Character Generator.app` anywhere
3. Right-click → Open (first time only)
4. Start Ollama
5. Ready to use

**Linux Users:**
1. Download `.AppImage` file
2. Make executable: `chmod +x *.AppImage`
3. Run: `./AI\ Character\ Generator*.AppImage`
4. Start Ollama: `ollama serve`

### Custom Icons

Add your own icons to `assets/` folder:
- `icon.ico` (Windows, 256x256)
- `icon.icns` (Mac)
- `icon.png` (Linux, 512x512)

See `assets/README.md` for icon generation tools.

### Why Portable Desktop App?

**Perfect Ollama Integration:**
- Desktop apps can access `localhost:11434` without CORS issues
- No browser security restrictions
- No HTTPS/mixed content problems
- Works exactly like running `npm run dev`

**User Experience:**
- Download and run - no installation wizard
- Works on any computer (even without admin rights)
- Portable - carry on USB drive
- Consistent experience across all platforms

---

## 📁 Project Cleanup

### Files to Keep (Essential)
```
AI-Character-Prompt-Generator/
├── dist/                      # Production build (ready to deploy)
├── src/                       # Source code
├── public/                    # Public assets & data files
├── node_modules/              # Dependencies (regenerate with npm install)
├── .git/                      # Version control
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies & scripts
├── package-lock.json          # Lock file
├── index.html                 # Entry point
├── vite.config.ts            # Build configuration
├── tsconfig*.json            # TypeScript configuration
├── vitest.config.ts          # Test configuration
├── eslint.config.js          # Code linting
├── postcss.config.js         # CSS processing
├── tailwind.config.js        # Tailwind CSS config
├── README.md                 # Main documentation
└── QUICKSTART.md             # Quick start guide
```

### Files to Remove (Development Artifacts)
```
# Documentation from development process:
- All PHASE*.md files
- All AUDIT*.md files
- All AGENT*.md files
- All PLAN*.md files
- IMPLEMENTATION*.md
- TESTING*.md
- UI_REDESIGN*.md
- etc.

# Old/duplicate folders:
- _old_python_app/
- AGENT_REPORTS/
- prompt-generator-electron/
- electron/ (if not using Electron)
- .claude/ (development only)

# Sensitive files:
- .env
```

### Cleanup Script
```bash
# Remove all development documentation
rm -f AGENT_*.md AUDIT_*.md PHASE*.md PLAN_*.md IMPLEMENTATION_*.md
rm -f TESTING_*.md UI_REDESIGN*.md CRITICAL_*.md COMPLETE_*.md
rm -f ARCHITECTURE_*.md CODE_AUDIT*.md CHANGES.md CSS_*.md
rm -f DEPLOYMENT_READY.md EXECUTION_*.md OLLAMA_*.md
rm -f PROMPT_GENERATION*.md QUICK_FIXES*.md STAT_SYSTEM*.md
rm -f styles\&angles.md INTEGRATION_COMPLETE.md AI_ENHANCEMENT_GUIDE.md
rm -f README_ELECTRON.md PRODUCTION_LAUNCH_READY.md FINAL_LAUNCH_COMPLETE.md

# Remove old folders
rm -rf _old_python_app
rm -rf AGENT_REPORTS
rm -rf prompt-generator-electron
rm -rf electron
rm -rf .claude

# Remove sensitive files
rm -f .env

echo "✅ Cleanup complete!"
```

---

## 🌐 Alternative Deployment Options

### Option 2: Static Website Hosting

The app is a pure client-side static website. No server needed!

**Note:** Website deployment has CORS limitations with Ollama. See [Ollama with Website](#ollama-with-website-deployment) section below.

#### 1A. Netlify (Easiest)

**Step 1: Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**Step 2: Deploy**
```bash
# One-time setup
netlify login

# Deploy production build
netlify deploy --prod --dir=dist
```

**Alternative: Drag & Drop**
1. Go to https://app.netlify.com/drop
2. Drag the `dist/` folder
3. Done! You get a URL instantly

**Custom Domain:**
```bash
# In Netlify dashboard, add custom domain
# Update DNS records:
# A record: @ → 75.2.60.5
# CNAME: www → your-site.netlify.app
```

**Cost:** FREE (100GB bandwidth/month)

---

#### 1B. Vercel

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
vercel --prod
```

**Alternative: GitHub Integration**
1. Push code to GitHub
2. Connect repo at https://vercel.com
3. Auto-deploys on every push

**Cost:** FREE (100GB bandwidth/month)

---

#### 1C. GitHub Pages

**Step 1: Install gh-pages**
```bash
npm install -g gh-pages
```

**Step 2: Update vite.config.ts**
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/Promt-AI-Image-generator/', // Your repo name
})
```

**Step 3: Rebuild and Deploy**
```bash
npm run build
npx gh-pages -d dist
```

**Step 4: Enable GitHub Pages**
1. Go to repo Settings → Pages
2. Source: gh-pages branch
3. URL: https://yourusername.github.io/Promt-AI-Image-generator/

**Cost:** FREE (unlimited)

---

#### 1D. AWS S3 + CloudFront

**Step 1: Create S3 Bucket**
```bash
aws s3 mb s3://ai-character-generator
aws s3 sync dist/ s3://ai-character-generator
```

**Step 2: Enable Static Website Hosting**
```bash
aws s3 website s3://ai-character-generator \
  --index-document index.html \
  --error-document index.html
```

**Step 3: Create CloudFront Distribution** (Optional, for HTTPS)
- Origin: S3 bucket
- Default Root Object: index.html
- SSL Certificate: Auto-generated

**Cost:** ~$0.50-2/month (depends on traffic)

---

### Option 3: Docker Container

For self-hosting or running locally.

**Create Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Create nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_types text/css application/javascript application/json;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Build and Run:**
```bash
# Build image
docker build -t ai-character-generator .

# Run container
docker run -d -p 8080:80 --name char-gen ai-character-generator

# Access at http://localhost:8080
```

**Docker Compose (docker-compose.yml):**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

```bash
docker-compose up -d
```

**Push to Docker Hub:**
```bash
docker tag ai-character-generator yourusername/ai-character-generator:latest
docker push yourusername/ai-character-generator:latest
```

---

## 🔧 Configuration for Deployment

### Update vite.config.ts (if using subdirectory)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Change to '/your-path/' if deploying to subdirectory
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react']
        }
      }
    }
  }
})
```

### Add deploy script to package.json
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "deploy:netlify": "npm run build && netlify deploy --prod --dir=dist",
    "deploy:vercel": "npm run build && vercel --prod",
    "deploy:gh-pages": "npm run build && gh-pages -d dist"
  }
}
```

---

## 📊 Deployment Comparison

| Option | Cost | Speed | Ease | HTTPS | Custom Domain | Best For |
|--------|------|-------|------|-------|---------------|----------|
| **Netlify** | Free | ⚡⚡⚡ | ⭐⭐⭐ | ✅ Auto | ✅ Free | Public website |
| **Vercel** | Free | ⚡⚡⚡ | ⭐⭐⭐ | ✅ Auto | ✅ Free | Public website |
| **GitHub Pages** | Free | ⚡⚡ | ⭐⭐ | ✅ Auto | ✅ Free | Open source |
| **AWS S3** | ~$2/mo | ⚡⚡ | ⭐ | ⚠️ Manual | ✅ Paid | Enterprise |
| **Docker** | $5-20/mo | ⚡ | ⭐⭐ | ⚠️ Manual | ✅ Any | Self-hosted |
| **Electron** | Free | ⚡⚡⚡ | ⭐ | N/A | N/A | Desktop app |

---

## ✅ Pre-Deployment Checklist

- [ ] Run cleanup script to remove dev files
- [ ] Build production version: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Verify all features work in preview
- [ ] Check bundle size (should be ~100KB gzipped)
- [ ] Test in different browsers (Chrome, Firefox, Edge)
- [ ] Update base URL in vite.config.ts if needed
- [ ] Choose deployment platform
- [ ] Deploy!
- [ ] Test deployed version
- [ ] Set up custom domain (optional)

---

## 🚀 Quick Deploy Commands

**Netlify:**
```bash
npm run build && netlify deploy --prod --dir=dist
```

**Vercel:**
```bash
npm run build && vercel --prod
```

**GitHub Pages:**
```bash
npm run build && npx gh-pages -d dist
```

**Docker:**
```bash
docker build -t ai-char-gen . && docker run -d -p 8080:80 ai-char-gen
```

---

## 🔒 Security Considerations

### For Static Hosting
- ✅ No server-side code = minimal attack surface
- ✅ All processing client-side
- ✅ No API keys required
- ✅ No database needed
- ⚠️ Enable HTTPS (free with Netlify/Vercel/GitHub Pages)
- ⚠️ Set proper CSP headers (Content Security Policy)

### For Docker
- ✅ Use official base images (node:alpine, nginx:alpine)
- ✅ Run as non-root user
- ✅ Scan images for vulnerabilities
- ✅ Keep base images updated

---

## 📝 Post-Deployment

### Monitor
- Check browser console for errors
- Monitor hosting platform analytics
- Check load times (should be <2s)

### Update
```bash
# Make changes
npm run build
npm run deploy:netlify  # or your platform
```

### Rollback (if needed)
Most platforms keep previous deployments:
- Netlify: Deployments → Select previous → Publish
- Vercel: Deployments → Select previous → Promote
- GitHub Pages: Revert git commit and re-deploy

---

## 🎉 Recommended Setup for You

**Best Choice: Netlify (Free + Easy + Fast)**

```bash
# 1. Clean up
bash cleanup.sh

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist

# Done! You'll get a URL like:
# https://ai-character-generator.netlify.app
```

**Optional: Add custom domain**
- Buy domain (e.g., Namecheap, Google Domains)
- Add to Netlify dashboard
- Update DNS records
- Get free SSL automatically

---

## 🤖 Ollama with Website Deployment

If you deploy as a website (Options 2-3), users will encounter CORS (Cross-Origin Resource Sharing) issues when connecting to their local Ollama instance.

### The Problem

When JavaScript runs in a browser from `https://yoursite.com`, it tries to connect to `http://localhost:11434`:

❌ **CORS Error:** Browser blocks cross-origin requests for security
❌ **Mixed Content:** HTTPS site can't access HTTP endpoints
❌ **Result:** Ollama features won't work without configuration

### Solutions for Website Users

**Option A: Enable CORS in Ollama** (Recommended for advanced users)

Users must start Ollama with CORS enabled:

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

**Windows (CMD):**
```cmd
set OLLAMA_ORIGINS=*
ollama serve
```

**Mac/Linux:**
```bash
OLLAMA_ORIGINS="*" ollama serve
```

**More secure (specific domain):**
```bash
OLLAMA_ORIGINS="https://yourapp.netlify.app" ollama serve
```

**Option B: Browser Extension** (Development only)

Install CORS extension:
- Chrome/Edge: "CORS Unblock"
- Firefox: "Allow CORS"

⚠️ Only for testing - not a production solution

**Option C: Use Desktop App Instead** (Best UX)

Direct users to download the portable desktop app:
- No configuration needed
- Ollama works automatically
- Better user experience

### Recommendation by Deployment Type

| Deployment | Ollama Viable? | User Experience | Recommendation |
|------------|----------------|-----------------|----------------|
| **Desktop App (Option 1)** | ✅ Perfect | ⭐⭐⭐⭐⭐ Easy | **Use this!** |
| **Website (HTTP)** | ⚠️ With CORS | ⭐⭐ Technical | For advanced users |
| **Website (HTTPS)** | ❌ Complex | ⭐ Very technical | Not recommended |

### Adding CORS Instructions to Your Website

If you deploy as a website, add instructions for users:

```markdown
## Using AI Features (Ollama)

To use AI prompt optimization:

1. Install Ollama from https://ollama.com
2. Start Ollama with CORS enabled:
   - Windows: `$env:OLLAMA_ORIGINS="*"; ollama serve`
   - Mac/Linux: `OLLAMA_ORIGINS="*" ollama serve`
3. Download a model (e.g., `ollama pull qwen2.5:3b-instruct`)
4. Refresh this page
5. AI features will now work!

**Easier alternative:** Download our desktop app for zero-configuration Ollama support.
```

---

**Ready to deploy!**

**Recommended:** Build the portable desktop app for best Ollama support.
**Alternative:** Deploy website for public access (AI features require user setup).
