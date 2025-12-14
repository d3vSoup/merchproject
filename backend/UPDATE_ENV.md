# How to Update Supabase Service Role Key

## Step-by-Step Instructions

### 1. Get Your Supabase Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project (`merchproj`)
3. Click **Settings** (gear icon in left sidebar)
4. Click **API** in the settings menu
5. Scroll down to **Project API keys**
6. Find the **`service_role`** key (NOT the `anon` key!)
7. Click the **eye icon** to reveal it (or copy button)
8. Copy the entire key (it's a long JWT, starts with `eyJ...`)

### 2. Update backend/.env File

1. Open `backend/.env` in a text editor
2. Find this line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Replace `your_service_role_key` with your actual key:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lcmNocHJvaiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MTk4NzY1NDIsImV4cCI6MjAzNTQ1MjU0Mn0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (Replace with your actual full key - it's usually 200+ characters)

4. **IMPORTANT**: 
   - Do NOT add quotes around the key
   - Do NOT add spaces before/after the `=`
   - Make sure there are no line breaks in the key
   - Save the file

### 3. Restart Backend Server

**Stop the current server** (Ctrl+C in the terminal where it's running), then:

```bash
cd backend
npm start
```

### 4. Verify It Works

1. Check the backend console - you should see:
   ```
   ✅ Supabase Admin client initialized successfully
   ```

2. Visit `http://localhost:4000/api/health` - it should show:
   ```json
   {
     "ok": true,
     "supabaseConfigured": true,
     "supabaseUrl": "https://merchproj.supabase.co",
     "supabaseKey": "Set",
     "keyLength": 200+,
     "keyPreview": "eyJhbGciOiJIUzI1NiI..."
   }
   ```

3. Try adding items to cart - it should work now!

## Troubleshooting

### If it still shows "PLACEHOLDER":
- Make sure you saved the `.env` file
- Make sure you restarted the backend server
- Check that the key doesn't have quotes: `SUPABASE_SERVICE_ROLE_KEY="key"` ❌
- Should be: `SUPABASE_SERVICE_ROLE_KEY=key` ✅

### If key is too short:
- Make sure you copied the ENTIRE key (it's very long, 200+ characters)
- Don't truncate it

### If key doesn't start with "eyJ":
- You might have copied the wrong key
- Make sure it's the `service_role` key, NOT the `anon` key

### Check what the backend sees:
```bash
cd backend
node -e "require('dotenv').config(); console.log('Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...');"
```

