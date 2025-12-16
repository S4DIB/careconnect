-- Setup Supabase Storage bucket for voice messages
-- Run this in Supabase SQL Editor after running fix-caregiver-links.sql

-- Note: You can't create storage buckets via SQL, you must do this in the Supabase Dashboard
-- Go to: Storage > Create a new bucket
-- Bucket name: voice-messages
-- Public bucket: YES (so audio files can be played)

-- After creating the bucket, run these policies:

-- Allow authenticated users to upload voice messages to their own folder
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
  'Users can upload their own voice messages',
  'voice-messages',
  '(bucket_id = ''voice-messages''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)',
  '(bucket_id = ''voice-messages''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)'
)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to view all voice messages they sent or received
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Users can view voice messages sent to or from them',
  'voice-messages',
  '(bucket_id = ''voice-messages''::text) AND (auth.role() = ''authenticated''::text)'
)
ON CONFLICT DO NOTHING;

