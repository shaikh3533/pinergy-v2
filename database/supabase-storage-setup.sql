-- ============================================
-- SPINERGY - Storage Buckets Setup
-- Creates and configures storage for profile pictures and videos
-- ============================================

-- Step 1: Create storage buckets (if they don't exist)
-- Note: This might fail if buckets already exist, which is fine

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile_pics', 'profile_pics', true),
  ('match_videos', 'match_videos', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Step 2: Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view match videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload match videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update match videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete match videos" ON storage.objects;

-- Step 3: Create storage policies for PROFILE_PICS bucket

-- Allow anyone to view profile pictures (public bucket)
CREATE POLICY "profile_pics_select_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_pics');

-- Allow authenticated users to upload their own profile picture
CREATE POLICY "profile_pics_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile_pics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile picture
CREATE POLICY "profile_pics_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile_pics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile picture
CREATE POLICY "profile_pics_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile_pics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Create storage policies for MATCH_VIDEOS bucket

-- Allow anyone to view match videos (public bucket)
CREATE POLICY "match_videos_select_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'match_videos');

-- Allow admins to upload match videos
CREATE POLICY "match_videos_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'match_videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Allow admins to update match videos
CREATE POLICY "match_videos_update_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'match_videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Allow admins to delete match videos
CREATE POLICY "match_videos_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'match_videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ STORAGE BUCKETS CONFIGURED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Buckets created:';
  RAISE NOTICE '   - profile_pics (public)';
  RAISE NOTICE '   - match_videos (public)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS policies created:';
  RAISE NOTICE '   - Users can upload/update/delete own profile pics';
  RAISE NOTICE '   - Anyone can view profile pics';
  RAISE NOTICE '   - Admins can manage match videos';
  RAISE NOTICE '   - Anyone can view match videos';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Profile picture uploads should work now!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

