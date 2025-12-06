-- Migration: Create avatars table for D-ID avatar master data
-- Created: 2025-12-06
-- Purpose: Store D-ID official avatar information for user selection

-- Create avatars table
CREATE TABLE IF NOT EXISTS avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  d_id_source_url TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_avatars_category ON avatars(category);
CREATE INDEX IF NOT EXISTS idx_avatars_is_active ON avatars(is_active);
CREATE INDEX IF NOT EXISTS idx_avatars_created_at ON avatars(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE avatars IS 'Master data table for D-ID official avatars';
COMMENT ON COLUMN avatars.id IS 'Unique identifier for avatar';
COMMENT ON COLUMN avatars.name IS 'Display name of the avatar';
COMMENT ON COLUMN avatars.d_id_source_url IS 'D-ID source image URL for API calls';
COMMENT ON COLUMN avatars.thumbnail_url IS 'Thumbnail image URL for UI display';
COMMENT ON COLUMN avatars.description IS 'Avatar description for users';
COMMENT ON COLUMN avatars.category IS 'Avatar category (general, business, casual, etc.)';
COMMENT ON COLUMN avatars.is_active IS 'Flag to enable/disable avatar availability';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at update
CREATE TRIGGER update_avatars_updated_at
  BEFORE UPDATE ON avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
