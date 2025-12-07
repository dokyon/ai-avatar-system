-- Migration: Create custom avatars table for HeyGen avatars
-- Created: 2025-12-06
-- Purpose: Store custom avatars created from uploaded photos

-- Create custom_avatars table
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
COMMENT ON TABLE custom_avatars IS 'Custom avatars created from uploaded photos using HeyGen';
COMMENT ON COLUMN custom_avatars.avatar_name IS 'User-provided name for the avatar';
COMMENT ON COLUMN custom_avatars.upload_id IS 'Reference to the original uploaded photo';
COMMENT ON COLUMN custom_avatars.heygen_avatar_id IS 'HeyGen API avatar ID';
COMMENT ON COLUMN custom_avatars.status IS 'Avatar creation status';
COMMENT ON COLUMN custom_avatars.preview_image_url IS 'Preview image URL from HeyGen';
COMMENT ON COLUMN custom_avatars.preview_video_url IS 'Preview video URL from HeyGen';

-- Create updated_at trigger
CREATE TRIGGER update_custom_avatars_updated_at
  BEFORE UPDATE ON custom_avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
