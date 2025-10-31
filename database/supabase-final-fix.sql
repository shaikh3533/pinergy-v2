-- ============================================
-- SPINERGY - FINAL RLS FIX (No Recursion)
-- This fixes the infinite recursion issue
-- ============================================

-- Step 1: Disable RLS temporarily to avoid issues
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can view all users" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can do everything with users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users as players" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "allow_select_users" ON users;
DROP POLICY IF EXISTS "allow_insert_own_user" ON users;
DROP POLICY IF EXISTS "allow_update_own_user" ON users;
DROP POLICY IF EXISTS "allow_admin_all" ON users;

DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "allow_select_bookings" ON bookings;
DROP POLICY IF EXISTS "allow_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "allow_update_bookings" ON bookings;
DROP POLICY IF EXISTS "allow_delete_bookings" ON bookings;

DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
DROP POLICY IF EXISTS "Admins can manage matches" ON matches;

DROP POLICY IF EXISTS "Anyone can view ads" ON ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON ads;

DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Anyone can submit suggestions" ON suggestions;
DROP POLICY IF EXISTS "Admins can manage suggestions" ON suggestions;
DROP POLICY IF EXISTS "allow_insert_suggestions" ON suggestions;
DROP POLICY IF EXISTS "allow_select_suggestions_own" ON suggestions;
DROP POLICY IF EXISTS "allow_update_suggestions_admin" ON suggestions;

-- Step 3: Drop and recreate the admin check function (SECURITY DEFINER prevents recursion)
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 4: Create/update the trigger for auto user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    phone,
    profile_pic,
    rating_points,
    level,
    total_hours_played,
    approved,
    role,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Player'),
    NEW.email,
    NEW.phone,
    NULL,
    0,
    'Noob',
    0,
    true,
    'player',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(users.name, EXCLUDED.name);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: CREATE SIMPLE RLS POLICIES (No recursion)
-- ============================================

-- USERS TABLE POLICIES
-- Policy 1: Anyone can view all users (for leaderboard, etc.)
CREATE POLICY "users_select_all"
  ON users FOR SELECT
  USING (true);

-- Policy 2: Users can insert via trigger only (this won't be used much due to trigger)
CREATE POLICY "users_insert_authenticated"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'player' AND approved = true);

-- Policy 3: Users can update their own profile
-- Simple check: only their own ID, and can't change role or approval
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'player' AND approved = true);

-- Policy 4: Admins can do everything (using SECURITY DEFINER function)
CREATE POLICY "users_admin_all"
  ON users FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- BOOKINGS TABLE POLICIES
-- Policy 1: Users can view their own bookings OR admins can view all
CREATE POLICY "bookings_select"
  ON bookings FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

-- Policy 2: Anyone can create bookings (for guest bookings)
CREATE POLICY "bookings_insert_all"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Policy 3: Users can update their own bookings OR admins can update all
CREATE POLICY "bookings_update"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

-- Policy 4: Only admins can delete bookings
CREATE POLICY "bookings_delete_admin"
  ON bookings FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- MATCHES TABLE POLICIES
-- Policy 1: Anyone can view matches
CREATE POLICY "matches_select_all"
  ON matches FOR SELECT
  USING (true);

-- Policy 2: Only admins can manage matches
CREATE POLICY "matches_admin_all"
  ON matches FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ADS TABLE POLICIES
-- Policy 1: Anyone can view ads
CREATE POLICY "ads_select_all"
  ON ads FOR SELECT
  USING (true);

-- Policy 2: Only admins can manage ads
CREATE POLICY "ads_admin_all"
  ON ads FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- SUGGESTIONS TABLE POLICIES
-- Policy 1: Anyone can insert suggestions
CREATE POLICY "suggestions_insert_all"
  ON suggestions FOR INSERT
  WITH CHECK (true);

-- Policy 2: Users can view their own OR admins can view all
CREATE POLICY "suggestions_select"
  ON suggestions FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

-- Policy 3: Only admins can update suggestions
CREATE POLICY "suggestions_update_admin"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON bookings TO anon;
GRANT INSERT ON suggestions TO anon;
GRANT INSERT ON users TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_hours_played(UUID, FLOAT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon, authenticated;

-- Step 8: Sync any existing auth users who don't have profiles
INSERT INTO public.users (id, name, email, approved, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.email,
  true,
  'player'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SPINERGY RLS FIXED - NO RECURSION!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database trigger created (auto user profiles)';
  RAISE NOTICE '✅ RLS policies created (no recursion)';
  RAISE NOTICE '✅ Admin function uses SECURITY DEFINER';
  RAISE NOTICE '✅ Guest bookings enabled';
  RAISE NOTICE '✅ Existing users synced';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 NEXT STEPS:';
  RAISE NOTICE '1. Disable email confirmations in Supabase Auth';
  RAISE NOTICE '2. Test signup with NEW email';
  RAISE NOTICE '3. Test booking';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Authentication should work perfectly now!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

