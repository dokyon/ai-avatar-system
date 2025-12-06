-- Migration: Insert initial D-ID official avatars
-- Created: 2025-12-06
-- Purpose: Populate avatars table with D-ID public avatar data

-- Insert D-ID official public avatars
-- Note: These are publicly available avatars from D-ID's public S3 bucket
INSERT INTO avatars (name, d_id_source_url, thumbnail_url, description, category, is_active)
VALUES
  (
    'Alice',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
    'Professional female avatar with friendly appearance. Ideal for corporate and educational content.',
    'business',
    true
  ),
  (
    'Amy',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/amy.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/amy.jpg',
    'Casual female avatar with warm expression. Suitable for general presentations and tutorials.',
    'general',
    true
  ),
  (
    'Anna',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/anna.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/anna.jpg',
    'Young professional female avatar. Perfect for modern training videos and onboarding.',
    'business',
    true
  ),
  (
    'James',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/james.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/james.jpg',
    'Professional male avatar with executive presence. Great for business presentations.',
    'business',
    true
  ),
  (
    'Michael',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/michael.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/michael.jpg',
    'Casual male avatar with approachable demeanor. Ideal for training and tutorial content.',
    'general',
    true
  ),
  (
    'Jessica',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/jessica.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/jessica.jpg',
    'Professional female avatar with confident appearance. Suitable for leadership training.',
    'business',
    true
  ),
  (
    'John',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/john.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/john.jpg',
    'Experienced male avatar with mature presence. Perfect for expert-level content.',
    'business',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
DO $$
DECLARE
  avatar_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO avatar_count FROM avatars;
  RAISE NOTICE 'Total avatars in database: %', avatar_count;
END $$;
