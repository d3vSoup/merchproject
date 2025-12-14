#!/bin/bash

# Script to verify no sensitive data is being committed
# Run this before pushing to GitHub

echo "🔍 Checking for sensitive files before push...\n"

# Check for .env files
echo "Checking for .env files..."
ENV_FILES=$(git ls-files | grep -E "\.env$" || true)
if [ -n "$ENV_FILES" ]; then
    echo "❌ ERROR: Found .env files in git tracking:"
    echo "$ENV_FILES"
    echo "\nRemove them with: git rm --cached <file>"
    exit 1
else
    echo "✅ No .env files found"
fi

# Check for potential secrets in code
echo "\nChecking for hardcoded secrets..."
SECRETS=$(grep -r "eyJhbGciOiJ" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null || true)
if [ -n "$SECRETS" ]; then
    echo "⚠️  WARNING: Found potential JWT tokens in code:"
    echo "$SECRETS"
    echo "\nPlease review and remove any hardcoded secrets"
fi

# Check for placeholder keys
PLACEHOLDERS=$(grep -r "your_service_role_key" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null || true)
if [ -n "$PLACEHOLDERS" ]; then
    echo "✅ Found placeholder keys (this is OK in .env.example files)"
fi

# Check for user data files
echo "\nChecking for user data files..."
USER_FILES=$(git ls-files | grep -E "_users\.json|\.db$|\.sqlite" || true)
if [ -n "$USER_FILES" ]; then
    echo "❌ ERROR: Found user data files:"
    echo "$USER_FILES"
    echo "\nRemove them with: git rm --cached <file>"
    exit 1
else
    echo "✅ No user data files found"
fi

echo "\n✅ All checks passed! Safe to push."
echo "\n📋 Remember to:"
echo "  1. Verify .env.example files exist"
echo "  2. Check that no real secrets are in code"
echo "  3. Review git status before pushing"

