# GitHub Setup Guide

This guide will help you safely push your project to GitHub while protecting sensitive data.

## 🔒 Security Checklist

Before pushing to GitHub, ensure:

- [x] `.env` files are in `.gitignore`
- [x] `.env.example` files exist as templates
- [x] No API keys or secrets are hardcoded in code
- [x] User data files (`_users.json`) are excluded
- [x] Upload directories are excluded

## 📋 Pre-Push Steps

### 1. Verify .gitignore is Working

```bash
# Check what will be committed (should NOT show .env files)
git status

# If you see .env files, remove them from git tracking:
git rm --cached backend/.env
git rm --cached merch/.env
```

### 2. Check for Sensitive Data in Code

```bash
# Search for potential secrets (should return no results)
grep -r "eyJhbGciOiJ" --exclude-dir=node_modules .
grep -r "SUPABASE_SERVICE_ROLE_KEY=" --exclude-dir=node_modules .
grep -r "your_service_role_key" --exclude-dir=node_modules .
```

### 3. Initialize Git Repository (if not already done)

```bash
cd /Users/rik_mac/Desktop/merchproj

# Initialize git (if not already initialized)
git init

# Add remote repository
git remote add origin https://github.com/d3vSoup/merchproject.git

# Or if remote already exists, update it:
git remote set-url origin https://github.com/d3vSoup/merchproject.git
```

### 4. Stage and Commit Files

```bash
# Add all files (respecting .gitignore)
git add .

# Check what will be committed (verify no .env files)
git status

# Commit
git commit -m "Initial commit: BMSCE Merchandise Platform"

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔐 Setting Up Secrets on GitHub

For production deployments, use GitHub Secrets:

1. Go to your repository: https://github.com/d3vSoup/merchproject
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`
   - `JWT_SECRET`

## 📝 For New Developers / Cloning

When someone clones your repository:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/d3vSoup/merchproject.git
   cd merchproject
   ```

2. **Set up backend environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with actual values
   ```

3. **Set up frontend (if needed):**
   ```bash
   cd merch
   cp .env.example .env
   # Edit .env with actual values
   ```

4. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../merch
   npm install
   ```

5. **Run the application:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm start
   
   # Terminal 2: Frontend
   cd merch
   npm run dev
   ```

## 🛡️ Security Best Practices

### ✅ DO:
- Use `.env.example` files as templates
- Keep all secrets in `.env` files (never commit them)
- Use environment variables in production
- Rotate secrets regularly
- Use GitHub Secrets for CI/CD

### ❌ DON'T:
- Commit `.env` files
- Hardcode API keys in source code
- Share `.env` files via email/chat
- Use production keys in development
- Commit user data files

## 🔍 Verify Before Each Push

Run this before pushing:

```bash
# Check for .env files
git ls-files | grep -E "\.env$"

# Should return nothing. If it returns files, remove them:
git rm --cached backend/.env
git rm --cached merch/.env
```

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Environment Variables Best Practices](https://12factor.net/config)

