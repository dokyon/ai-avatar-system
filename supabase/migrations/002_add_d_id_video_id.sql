-- Add d_id_video_id column to videos table
-- This column stores the D-ID API video ID for tracking and reference

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS d_id_video_id TEXT;

-- Create index for faster lookups by D-ID video ID
CREATE INDEX IF NOT EXISTS idx_videos_d_id_video_id ON videos(d_id_video_id);

-- Add comment for documentation
COMMENT ON COLUMN videos.d_id_video_id IS 'D-ID API video ID for tracking video generation status';
