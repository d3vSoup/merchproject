# ⚠️ PRE-PUSH CHECKLIST

**CRITICAL: Run these commands before pushing to GitHub!**

## 🚨 Remove Sensitive Files from Git

```bash
cd /Users/rik_mac/Desktop/merchproj

# Remove git lock if exists
rm -f .git/index.lock

# Remove sensitive files from git tracking
git rm --cached backend/.env
git rm --cached merch/.env
git rm --cached backend/_users.json

# Remove .DS_Store files
find . -name ".DS_Store" -exec git rm --cached {} \; 2>/dev/null || true

# Verify they're removed
git status | grep -E "\.env|_users|\.DS_Store"
# Should return nothing
```

## ✅ Verify .gitignore is Working

```bash
# Check what will be committed (should NOT show .env files)
git status

# Run verification script
./verify-before-push.sh
```

## 📝 Files That Should NOT Be Committed

- ❌ `backend/.env`
- ❌ `merch/.env`
- ❌ `backend/_users.json`
- ❌ `backend/uploads/` (any uploaded files)
- ❌ `.DS_Store` (macOS files)
- ❌ `node_modules/` (already in .gitignore)
- ❌ Any files with real API keys or secrets

## ✅ Files That SHOULD Be Committed

- ✅ `.env.example` files (templates)
- ✅ All source code
- ✅ Documentation files
- ✅ SQL migration files
- ✅ `package.json` files
- ✅ `.gitignore`

## 🔐 After Removing Sensitive Files

```bash
# Stage the updated .gitignore
git add .gitignore

# Commit the cleanup
git commit -m "chore: remove sensitive files from tracking"

# Verify one more time
git status

# Then push
git push origin main
```

## 🆘 If You Already Pushed Sensitive Data

If you accidentally pushed sensitive data:

1. **Immediately rotate all secrets:**
   - Generate new Supabase service role key
   - Generate new JWT secret
   - Update Google OAuth credentials if needed

2. **Remove from git history (if recent):**
   ```bash
   # Remove file from all commits (use with caution!)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (coordinate with team first!):**
   ```bash
   git push origin --force --all
   ```

4. **Update all .env files** with new credentials

## 📚 Next Steps

1. ✅ Remove sensitive files (commands above)
2. ✅ Verify with `./verify-before-push.sh`
3. ✅ Commit changes
4. ✅ Push to GitHub
5. ✅ Set up GitHub Secrets for CI/CD (optional)

