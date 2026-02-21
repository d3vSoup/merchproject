# 🚀 Vercel Deployment Guide

## Frontend Deployment (Vercel)

### 1. Environment Variables Setup

In your Vercel project settings, add these environment variables:

**Required:**
- `VITE_API_URL` = `https://bmsce-merch-backend.onrender.com`
- `VITE_GOOGLE_CLIENT_ID` = Your Google OAuth Client ID

**How to add:**
1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project (`bmscemerch` or `merchproject`)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://bmsce-merch-backend.onrender.com`
   - **Environment:** Production, Preview, Development (select all)
5. Repeat for `VITE_GOOGLE_CLIENT_ID`
6. **Redeploy** your application after adding variables

### 2. Build Settings

**Framework Preset:** Vite
**Build Command:** `npm run build` (or `cd merch && npm run build` if root)
**Output Directory:** `merch/dist` (or `dist` if building from merch folder)
**Install Command:** `npm install` (or `cd merch && npm install`)

**Important:** The `vercel.json` file is already configured to handle SPA routing. This ensures that refreshing any route (like `/event/utsav` or `/wishlist`) won't result in a 404 error. All routes are rewritten to `index.html` so React Router can handle them client-side.

### 3. Verify Deployment

After deployment, check:
1. ✅ Site loads: `https://bmscemerch.vercel.app`
2. ✅ API calls work (check browser console for errors)
3. ✅ Google Sign-In works (after OAuth setup)

## Backend Deployment (Render)

### 1. Environment Variables on Render

In your Render dashboard, add these environment variables:

**Required:**
- `SUPABASE_URL` = Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- `GOOGLE_CLIENT_ID` = Your Google OAuth Client ID
- `JWT_SECRET` = A strong random secret
- `PORT` = `4000` (or let Render assign)

**How to add:**
1. Go to: https://dashboard.render.com/
2. Select your service (`bmsce-merch-backend`)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable and click **Save Changes**
6. **Redeploy** after adding variables

### 2. CORS Configuration

The backend is already configured to accept requests from:
- ✅ `https://bmscemerch.vercel.app`
- ✅ `https://merchproject.vercel.app`
- ✅ All Vercel preview deployments
- ✅ Localhost (for development)

### 3. Health Check

Test your backend:
```bash
curl https://bmsce-merch-backend.onrender.com/api/health
```

Should return:
```json
{"ok":true,"now":"..."}
```

## 🔗 Important URLs

**Frontend (Vercel):**
- Production: `https://bmscemerch.vercel.app`
- Preview: `https://bmscemerch-*.vercel.app` (auto-generated)

**Backend (Render):**
- API: `https://bmsce-merch-backend.onrender.com`

## 🔐 OAuth Configuration

Don't forget to add Vercel URLs to Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins:**
   - `https://bmscemerch.vercel.app`
   - `https://merchproject.vercel.app`
   - `http://localhost:5173`
4. Save and wait 5-10 minutes

See `OAUTH_SETUP.md` for detailed instructions.

## 🐛 Troubleshooting

### 404 Error on Page Refresh

**Symptom:** Getting `404: NOT_FOUND` when refreshing any route like `/event/utsav` or `/wishlist`

**Solution:** ✅ Already fixed! The `vercel.json` file includes rewrite rules that redirect all routes to `index.html`. 

If you still see 404 errors:
1. ✅ Make sure `vercel.json` is in the `merch/` folder (root of your frontend)
2. ✅ Redeploy your Vercel app after adding/updating `vercel.json`
3. ✅ Clear browser cache and try again

### Frontend can't connect to backend

**Check:**
1. ✅ `VITE_API_URL` is set in Vercel environment variables
2. ✅ Backend is running (check Render dashboard)
3. ✅ CORS is configured correctly in backend
4. ✅ No typos in the API URL

**Debug:**
- Open browser console (F12)
- Check Network tab for failed API calls
- Look for CORS errors

### Google Sign-In not working

**Check:**
1. ✅ `VITE_GOOGLE_CLIENT_ID` is set in Vercel
2. ✅ Vercel URL is added to Google Cloud Console
3. ✅ OAuth origins match exactly (no trailing slashes)

### Backend errors

**Check:**
1. ✅ All environment variables are set in Render
2. ✅ Supabase credentials are correct
3. ✅ Backend logs in Render dashboard

### Merch line-up not loading (stuck on skeleton)

**Cause:** Render free tier spins down after ~15 min of inactivity. First request can take 30–60 seconds to wake the backend.

**Solutions:**
1. **Wait 12–15 seconds** – The app now shows products after 12s even if the API is slow
2. **Check Render** – In Render dashboard, confirm the service is running (not "Suspended")
3. **Verify VITE_API_URL** – Must be `https://bmsce-merch-backend.onrender.com` in Vercel env vars
4. **Upgrade Render** – Paid plan keeps the backend always-on (no cold starts)

### "User not found" when saving profile

**Cause:** Render restarts lose in-memory/file user data. Your JWT is valid but the backend can't find the user record.

**Solution:** ✅ Fixed – Profile save now uses Supabase as fallback. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Render.

### Profile sync issues (phone vs laptop)

**Cause:** Different devices may have different tokens. If the backend restarted, one device's token may reference a user ID that no longer exists.

**Solution:** Sign out and sign in again on both devices. The profile endpoint now uses Supabase, so data persists across backend restarts.

## 📝 Quick Checklist

Before deploying:
- [ ] Backend deployed on Render
- [ ] Backend environment variables set
- [ ] Frontend environment variables set in Vercel
- [ ] OAuth origins added to Google Cloud Console
- [ ] CORS configured in backend
- [ ] Test sign-in works
- [ ] Test API calls work

