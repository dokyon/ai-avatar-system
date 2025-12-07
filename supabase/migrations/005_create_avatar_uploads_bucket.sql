-- Migration: Create avatar uploads storage bucket
-- Created: 2025-12-06
-- Purpose: Store uploaded photos for custom avatar creation

-- Create storage bucket for avatar photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-uploads', 'avatar-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security) for the bucket
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

-- Create avatar_upload_history table
CREATE TABLE IF NOT EXISTS avatar_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
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
CREATE TRIGGER update_avatar_upload_history_updated_at
  BEFORE UPDATE ON avatar_upload_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
