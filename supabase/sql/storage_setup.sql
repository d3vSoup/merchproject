-- Storage Bucket Setup for Resell Images
-- Run this in your Supabase SQL Editor to create the storage bucket

-- Note: Storage buckets must be created via the Supabase Dashboard or Storage API
-- This file provides instructions and RLS policies

-- 1. Create the bucket manually:
--    Go to Supabase Dashboard → Storage → Create Bucket
--    Name: resell-images
--    Public: Yes (or configure RLS policies below)
--    File size limit: 10MB (or as needed)
--    Allowed MIME types: image/*

-- 2. If bucket is public, you can skip RLS policies
--    If bucket is private, use the policies below:

-- RLS Policies for resell-images bucket (if private)
-- Note: PostgreSQL doesn't support "IF NOT EXISTS" for policies, so we drop first

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read resell-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resell-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read all files in resell-images
CREATE POLICY "Users can read resell-images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resell-images');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resell-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: If using service role key in backend, these policies don't apply
-- The backend can upload/read/delete files directly using the service role key
-- So if your bucket is public OR you're using the backend endpoint, you don't need these policies

