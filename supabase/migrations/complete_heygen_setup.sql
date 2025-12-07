-- Complete HeyGen Integration Setup
-- Run this SQL in Supabase Dashboard > SQL Editor
-- This sets up all required tables, storage buckets, and functions

-- ============================================================
-- STEP 1: Create update_updated_at_column function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 2: Create avatar uploads storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-uploads', 'avatar-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS policies for the bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatar-uploads');

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatar-uploads');

CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatar-uploads');

-- ============================================================
-- STEP 3: Create avatar_upload_history table
-- ============================================================
CREATE TABLE IF NOT EXISTS avatar_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'processing', 'completed', 'failed')),
  face_detected BOOLEAN DEFAULT false,
  face_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_avatar_upload_history_status ON avatar_upload_history(upload_status);
CREATE INDEX IF NOT EXISTS idx_avatar_upload_history_created_at ON avatar_upload_history(created_at DESC);

-- Add comments
COMMENT ON TABLE avatar_upload_history IS 'History of uploaded avatar photos';
COMMENT ON COLUMN avatar_upload_history.file_name IS 'Original file name';
COMMENT ON COLUMN avatar_upload_history.storage_path IS 'Path in Supabase Storage';
COMMENT ON COLUMN avatar_upload_history.face_detected IS 'Whether at least one face was detected';
COMMENT ON COLUMN avatar_upload_history.face_count IS 'Number of faces detected in the image';

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_avatar_upload_history_updated_at ON avatar_upload_history;
CREATE TRIGGER update_avatar_upload_history_updated_at
  BEFORE UPDATE ON avatar_upload_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Create custom_avatars table
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_name TEXT NOT NULL,
  upload_id UUID REFERENCES avatar_upload_history(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  heygen_avatar_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  preview_image_url TEXT,
  preview_video_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_avatars_status ON custom_avatars(status);
CREATE INDEX IF NOT EXISTS idx_custom_avatars_heygen_id ON custom_avatars(heygen_avatar_id);
CREATE INDEX IF NOT EXISTS idx_custom_avatars_created_at ON custom_avatars(created_at DESC);

-- Add comments
COMMENT ON TABLE custom_avatars IS 'Custom HeyGen Photo Avatars';
COMMENT ON COLUMN custom_avatars.avatar_name IS 'User-provided name for the avatar';
COMMENT ON COLUMN custom_avatars.heygen_avatar_id IS 'HeyGen avatar ID returned from Photo Avatar API';
COMMENT ON COLUMN custom_avatars.status IS 'Avatar creation status';

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_custom_avatars_updated_at ON custom_avatars;
CREATE TRIGGER update_custom_avatars_updated_at
  BEFORE UPDATE ON custom_avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 5: Verify setup
-- ============================================================
-- Check if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'avatar_upload_history') THEN
    RAISE NOTICE 'avatar_upload_history table created successfully';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'custom_avatars') THEN
    RAISE NOTICE 'custom_avatars table created successfully';
  END IF;

  IF EXISTS (SELECT FROM storage.buckets WHERE id = 'avatar-uploads') THEN
    RAISE NOTICE 'avatar-uploads bucket created successfully';
  END IF;
END $$;

-- ============================================================
-- DONE! Now reload the schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
