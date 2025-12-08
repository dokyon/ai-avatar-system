-- Fix avatar-uploads bucket RLS policies
-- Run this SQL in Supabase Dashboard > SQL Editor

-- ============================================================
-- Update storage bucket policies to allow anon/public access
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Create new policies that allow anon and authenticated users
CREATE POLICY "Allow anon and authenticated uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'avatar-uploads');

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatar-uploads');

CREATE POLICY "Allow anon and authenticated delete"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'avatar-uploads');

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%avatar%';
