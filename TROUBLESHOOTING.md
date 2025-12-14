# Troubleshooting Cart Issues

## If cart operations are failing:

### 1. Check Backend Configuration

Visit `http://localhost:4000/api/health` (or your backend URL) to see if Supabase is configured:

```json
{
  "ok": true,
  "supabaseConfigured": true/false,
  "supabaseUrl": "Set" or "Missing",
  "supabaseKey": "Set" or "PLACEHOLDER - NEEDS REAL KEY"
}
```

### 2. Fix Supabase Service Role Key

**CRITICAL**: Your `backend/.env` file has:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

This is a **placeholder**. You need to replace it with your **actual** Supabase Service Role Key:

1. Go to your Supabase project dashboard
2. Settings → API
3. Copy the **Service Role Key** (NOT the anon key - this is secret!)
4. Update `backend/.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual key)
   ```
5. Restart the backend server

### 3. Check Browser Console

Open DevTools (F12) → Console tab and look for:
- Network errors (401, 403, 500)
- Error messages from API calls
- Check the Network tab → see the actual error response from backend

### 4. Check Backend Logs

When you try to add to cart, check your backend terminal for:
- "Supabase Admin client initialized" (good)
- "Supabase not properly configured" (bad - fix .env)
- Error messages with details

### 5. Verify User Has supabaseId

1. Sign in with Google
2. Open DevTools → Application → LocalStorage
3. Check `user` object - it should have `supabaseId` field
4. If missing, sign out and sign in again (backend will create it)

### 6. Test Backend Directly

```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Test cart (replace TOKEN with your JWT token)
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/cart
```

### Common Errors:

- **"Supabase not configured on server"** → Fix SUPABASE_SERVICE_ROLE_KEY in backend/.env
- **"Failed to get user ID"** → User not created in Supabase, sign in again
- **401 Unauthorized** → Token expired or invalid, sign in again
- **500 Server error** → Check backend logs for detailed error

