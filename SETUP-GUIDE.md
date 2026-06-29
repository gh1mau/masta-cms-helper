# 🚀 Setup Guide: Masta CMS Helper - GitHub Pages Deployment

## Overview

Panduan lengkap untuk deploy Masta CMS Helper ke GitHub Pages dengan auto-update CISA KEV data.

---

## 📋 Prerequisites

Pastikan anda ada:

1. **GitHub Account** - [Sign up](https://github.com/signup)
2. **Git** - [Download](https://git-scm.com/downloads)
3. **Kod Editor** - VS Code (recommended)

---

## Step 1: Create GitHub Repository

### 1.1 Buat Repo Baru di GitHub

1. Pergi ke [github.com/new](https://github.com/new)
2. **Repository name**: `masta-cms-helper`
3. **Description**: `SOC-style security hardening dashboard for Joomla, WordPress, and Drupal`
4. Pilih **Public** (untuk GitHub Pages free)
5. ✅ **Add a README file** (optional)
6. Click **Create repository**

### 1.2 Push Local Code ke GitHub

Buka Terminal/Command Prompt:

```bash
# Navigate ke project folder
cd c:\Users\USER\Desktop\masta-cms-helper

# Initialize Git (jika belum)
git init

# Add semua files
git add .

# Commit
git commit -m "Initial commit: Production ready Masta CMS Helper"

# Rename branch ke main
git branch -M main

# Connect ke remote repo (gantikan YOUR_USERNAME dengan username GitHub anda)
git remote add origin https://github.com/YOUR_USERNAME/masta-cms-helper.git

# Push ke GitHub
git push -u origin main
```

**Verify**: Pergi ke `https://github.com/YOUR_USERNAME/masta-cms-helper` dan pastikan files ada di sana.

---

## Step 2: Enable GitHub Pages

### 2.1 Aktifkan Pages

1. Pergi ke repo di GitHub
2. Click **Settings** (tab atas)
3. Di sidebar kiri, click **Pages**
4. Under **Source**, select **Deploy from a branch**
5. **Branch**: Pilih `main` / `/(root)`
6. Click **Save**

### 2.2 Tunggu Deployment

- GitHub akan build dan deploy dalam **2-5 minit**
- Refresh page untuk nampak status
- URL akan muncul sebagai: `https://YOUR_USERNAME.github.io/masta-cms-helper/`

### 2.3 Verify Deployment

1. Buka URL di browser
2. Dashboard sepatutnya load dengan sempurna
3. Check browser console untuk memastikan JSON files loaded:
   ```
   ✅ Loaded joomla.json: 6 items
   ✅ Loaded wordpress.json: 10 items
   ...
   ```

---

## Step 3: Setup GitHub Actions untuk Auto-Update CISA KEV

### 3.1 Create Workflow Folder

Dalam project folder, create folder structure:

```
.github/
└── workflows/
    └── update-kev.yml
```

**Buka terminal:**

```bash
cd c:\Users\USER\Desktop\masta-cms-helper
mkdir -p .github/workflows
```

### 3.2 Create GitHub Actions Workflow

Create file `.github/workflows/update-kev.yml` dengan content:

```yaml
name: Update CISA KEV Data

on:
  schedule:
    # Run daily at 00:00 UTC
    - cron: "0 0 * * *"
  workflow_dispatch:
    # Allow manual trigger

jobs:
  update-kev:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Download latest CISA KEV
        run: |
          curl -s https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json -o data/cisa_kev.json

      - name: Verify download
        run: |
          python3 -c "
          import json
          with open('data/cisa_kev.json', 'r') as f:
              data = json.load(f)
          print(f'✅ Downloaded {len(data.get(\"vulnerabilities\", []))} vulnerabilities')
          print(f'📅 Catalog version: {data.get(\"catalogVersion\", \"N/A\")}')
          print(f'🕐 Released: {data.get(\"dateReleased\", \"N/A\")}')
          "

      - name: Commit and push if changed
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/cisa_kev.json
          git diff --quiet && git diff --staged --quiet || git commit -m "Update CISA KEV data - $(date +'%Y-%m-%d')"
          git push
```

### 3.3 Commit Workflow File

```bash
cd c:\Users\USER\Desktop\masta-cms-helper
git add .github/workflows/update-kev.yml
git commit -m "Add GitHub Actions workflow for daily CISA KEV updates"
git push
```

### 3.4 Verify Workflow

1. Pergi ke repo di GitHub
2. Click **Actions** tab
3. You should see workflow "Update CISA KEV Data"
4. Click **Run workflow** → **Run workflow** untuk test manual
5. Tunggu sehingga complete (hijau ✓)

---

## Step 4: Konfigurasi Lanjutan (Optional)

### 4.1 Add Custom Domain (Jika ada)

Jika anda ada custom domain:

1. Create file `CNAME` dalam root project:

   ```
   security.yourdomain.com
   ```

2. Commit ke GitHub:

   ```bash
   echo "security.yourdomain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

3. Di GitHub Settings > Pages:
   - Masukkan custom domain
   - ✅ Enforce HTTPS

4. Setup DNS di domain provider:
   - Type: CNAME
   - Name: security
   - Value: YOUR_USERNAME.github.io

### 4.2 Repository Settings

Di GitHub repo, pergi ke **Settings** > **General**:

- **Social Preview**: Upload logo.png untuk social media sharing
- **Topics**: Add tags seperti `security`, `cms`, `joomla`, `wordpress`, `drupal`, `hardening`

---

## Step 5: Verify Everything Works

### 5.1 Checklist Verification

- [ ] Buka `https://YOUR_USERNAME.github.io/masta-cms-helper/`
- [ ] Dashboard load tanpa error
- [ ] Console tunjuk semua JSON loaded
- [ ] Checklist items tunjuk dengan betul
- [ ] CVE/KEV data display
- [ ] Radar chart berfungsi
- [ ] Progress tracking berfungsi

### 5.2 Test Auto-Update

1. Pergi ke **Actions** tab
2. Workflow sepatutnya run secara auto setiap hari
3. Check history untuk verify updates berjaya
4. Files `data/cisa_kev.json` sepatutnya update dengan latest data

---

## 🛠️ Troubleshooting

### Issue 1: 404 Error pada GitHub Pages

**Solution:**

- Pastikan repo Public (bukan Private)
- Wait 5-10 minit selepas enable Pages
- Check Settings > Pages untuk error messages

### Issue 2: JSON Files Not Loading

**Check:**

- Buka browser console (F12)
- Check untuk CORS errors
- Verify file paths dalam `app.js` (should be relative: `data/file.json`)

### Issue 3: Workflow Not Running

**Check:**

- Pergi ke Actions tab
- Check untuk disabled workflows
- Enable workflows jika perlu

---

## 📚 File Structure Reference

```
masta-cms-helper/
├── .github/
│   └── workflows/
│       └── update-kev.yml      # GitHub Actions workflow
├── css/
│   ├── animations.css
│   ├── components.css
│   ├── kev.css
│   ├── layout.css
│   ├── reset.css
│   ├── responsive.css
│   └── variables.css
├── data/
│   ├── apache.json
│   ├── cisa_kev.json          # Auto-updated by GitHub Actions
│   ├── drupal.json
│   ├── iis.json
│   ├── joomla.json
│   ├── linux.json
│   ├── nginx.json
│   ├── windows.json
│   └── wordpress.json
├── js/
│   ├── app.js                 # Main application
│   ├── kev_data.js           # Fallback KEV data
│   └── kevRenderer.js        # KEV renderer
├── AGENTS.md                  # Documentation
├── index.html                 # Entry point
└── logo.png                   # Branding
```

---

## 🎯 Quick Commands Reference

```bash
# Push updates
git add .
git commit -m "Your message"
git push

# Check status
git status

# View logs
git log --oneline

# Pull latest (jika ada changes di GitHub)
git pull
```

---

## 📞 Support

Jika ada masalah:

1. Check browser console untuk errors
2. Verify semua files dalam repo
3. Check GitHub Actions logs
4. Hubungi: gh1mau.rulez@gmail.com

---

**🎉 Selamat! Aplikasi anda kini live di GitHub Pages dengan auto-update CISA KEV!**
