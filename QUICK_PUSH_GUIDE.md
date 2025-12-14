# 🚀 Quick Push Guide

## ⚠️ CRITICAL: Remove Sensitive Files First!

Run these commands **BEFORE** pushing:

```bash
cd /Users/rik_mac/Desktop/merchproj

# Remove sensitive files from git
git rm --cached -f backend/.env backend/_users.json

# Remove all node_modules from git (they should never be committed)
git ls-files | grep "node_modules" | xargs git rm --cached -f

# Remove .DS_Store files
find . -name ".DS_Store" -exec git rm --cached {} \; 2>/dev/null || true

# Verify they're removed
git status | grep -E "\.env|_users|node_modules"
# Should return NOTHING
```

## ✅ Then Push Safely

```bash
# Add all safe files
git add .

# Verify what will be committed (check for .env, _users, node_modules)
git status

# Commit
git commit -m "Initial commit: BMSCE Merchandise Platform"

# Add remote (if not already)
git remote add origin https://github.com/d3vSoup/merchproject.git

# Push
git push -u origin main
```

## 🔍 What Should NOT Be Committed

- ❌ `backend/.env`
- ❌ `merch/.env`
- ❌ `backend/_users.json`
- ❌ `node_modules/` (anywhere)
- ❌ `.DS_Store`
- ❌ `backend/uploads/`

## ✅ What SHOULD Be Committed

- ✅ All source code (`.js`, `.jsx`, `.css`, etc.)
- ✅ `package.json` and `package-lock.json`
- ✅ `.env.example` files
- ✅ Documentation (`.md` files)
- ✅ SQL migrations
- ✅ `.gitignore`

