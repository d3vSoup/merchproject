# Storage Bucket Setup Guide

## Creating the `resell-images` Storage Bucket

The storage bucket must be created in the **Supabase Dashboard**, not in SQL. Here's how:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project: https://app.supabase.com
2. Select your project

### Step 2: Navigate to Storage
1. Click **"Storage"** in the left sidebar
2. You should see a list of buckets (or an empty list if none exist)

### Step 3: Create New Bucket
1. Click **"New bucket"** or **"Create bucket"** button
2. Fill in the details:
   - **Name**: `resell-images` (must be exactly this name)
   - **Public bucket**: ✅ **Check this** (makes it easier, no RLS needed)
   - **File size limit**: 10MB (or as needed)
   - **Allowed MIME types**: `image/*` (or leave empty for all)

### Step 4: Save
1. Click **"Create bucket"** or **"Save"**
2. The bucket should now appear in your storage list

## That's It!

Once the bucket is created:
- ✅ Image uploads will work automatically
- ✅ No RLS policies needed if bucket is public
- ✅ Backend uses service role key (bypasses RLS anyway)

## Troubleshooting

### "Bucket not found" error
- Make sure the bucket name is exactly `resell-images` (case-sensitive)
- Check that you're in the correct Supabase project

### "Permission denied" error
- If bucket is private, you can either:
  1. Make it public (recommended for simplicity)
  2. Or set up RLS policies (see `supabase/sql/storage_setup.sql`)

### Can't find Storage in Dashboard
- Make sure you're logged into Supabase
- Check that you have the correct project selected
- Storage should be in the left sidebar menu

## Alternative: Use Backend Upload (Already Implemented)

The backend now has an upload endpoint (`/api/resell/upload-image`) that:
- Uses the service role key (bypasses RLS)
- Automatically creates the bucket path structure
- Returns public URLs

This is already set up in the code, so you just need to create the bucket in the dashboard!

