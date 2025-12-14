# 🔐 Google OAuth Setup Guide

## ⚠️ Error: "origin_mismatch" or "OAuth 2.0 policy"

If you see this error, you need to configure authorized origins in Google Cloud Console.

## 📋 Step-by-Step Fix

### 1. Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**

### 2. Find Your OAuth 2.0 Client ID

1. Look for **OAuth 2.0 Client IDs** section
2. Click on your client ID (the one used in `VITE_GOOGLE_CLIENT_ID`)

### 3. Add Authorized JavaScript Origins

Click **+ ADD URI** and add these origins:

```
https://bmscemerch.vercel.app
https://merchproject.vercel.app
http://localhost:5173
http://127.0.0.1:5173
```

**Important:** 
- Include `https://` for production
- Include `http://` for localhost
- No trailing slashes!

### 4. Add Authorized Redirect URIs

Click **+ ADD URI** under "Authorized redirect URIs" and add:

```
https://bmscemerch.vercel.app
http://localhost:5173
```

### 5. Save Changes

Click **SAVE** at the bottom

### 6. Wait for Propagation

Changes can take **5-10 minutes** to propagate. Try again after waiting.

## 🔍 Verify Your Setup

After adding origins, your OAuth client should show:

**Authorized JavaScript origins:**
- ✅ `https://bmscemerch.vercel.app`
- ✅ `https://merchproject.vercel.app`
- ✅ `http://localhost:5173`
- ✅ `http://127.0.0.1:5173`

**Authorized redirect URIs:**
- ✅ `https://bmscemerch.vercel.app`
- ✅ `http://localhost:5173`

## 🚨 Common Mistakes

1. **Missing `https://`** - Must include the protocol
2. **Trailing slashes** - Don't add `/` at the end
3. **Wrong domain** - Must match exactly what's in the browser URL
4. **Not saving** - Click SAVE after adding URIs
5. **Impatient** - Wait 5-10 minutes for changes to propagate

## ✅ Testing

1. Clear browser cache
2. Try signing in again
3. You should be able to select any Google account
4. If it fails, you can click "Try again" to select a different account

## 📝 For Vercel Deployments

If you deploy to a new Vercel URL, add it to:
1. Google Cloud Console (Authorized JavaScript origins)
2. Backend CORS configuration (`backend/index.js`)

## 🔗 Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

