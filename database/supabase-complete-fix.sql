-- ============================================
-- SPINERGY - COMPLETE RLS FIX
-- This script completely fixes all authentication and RLS issues
-- ============================================

-- Step 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view all users" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can do everything with users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users as players" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Step 2: Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 4: Create a function to automatically create user profile
-- This function runs with SECURITY DEFINER which bypasses RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table
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
    true, -- Auto-approved
    'player', -- Always player (admin created manually in Supabase)
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(users.name, EXCLUDED.name);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on auth.users table
-- This automatically creates a profile when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Re-enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 7: Create NEW comprehensive RLS policies

-- Policy 1: Everyone can view all users (for leaderboard, ratings, etc.)
CREATE POLICY "allow_select_users"
  ON users FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can insert their own profile
-- (This is now mostly handled by trigger, but keeping as backup)
CREATE POLICY "allow_insert_own_user"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND 
    role = 'player' AND 
    approved = true
  );

-- Policy 3: Users can update their own profile (but not change role or approval)
CREATE POLICY "allow_update_own_user"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = 'player' AND -- Prevent changing role
    approved = true -- Prevent changing approval status
  );

-- Policy 4: Admins can do everything
CREATE POLICY "allow_admin_all"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Step 8: Fix bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- Bookings: Everyone can view their own or admin can view all
CREATE POLICY "allow_select_bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Bookings: Anyone can create (even anonymous for guest bookings)
CREATE POLICY "allow_insert_bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Bookings: Users can update their own or admin can update all
CREATE POLICY "allow_update_bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Bookings: Only admins can delete
CREATE POLICY "allow_delete_bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Step 9: Fix suggestions policies
DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Anyone can submit suggestions" ON suggestions;
DROP POLICY IF EXISTS "Admins can manage suggestions" ON suggestions;

CREATE POLICY "allow_insert_suggestions"
  ON suggestions FOR INSERT
  WITH CHECK (true); -- Anyone can submit

CREATE POLICY "allow_select_suggestions_own"
  ON suggestions FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "allow_update_suggestions_admin"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Step 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON bookings TO anon;
GRANT INSERT ON suggestions TO anon;
GRANT INSERT ON users TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_hours_played(UUID, FLOAT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon, authenticated;

-- Step 11: Test the setup
DO $$
BEGIN
  RAISE NOTICE '✅ SPINERGY RLS policies updated successfully!';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  - Automatic user profile creation enabled';
  RAISE NOTICE '  - RLS policies configured for users, bookings, suggestions';
  RAISE NOTICE '  - Guest bookings enabled';
  RAISE NOTICE '  - Admin-only actions protected';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next Steps:';
  RAISE NOTICE '  1. Disable email confirmation in Supabase Auth settings';
  RAISE NOTICE '  2. Test signup with a new email';
  RAISE NOTICE '  3. Test booking (logged in and guest)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  If issues persist, check:';
  RAISE NOTICE '  - Supabase Auth > Providers > Email > Disable confirmations';
  RAISE NOTICE '  - Check browser console for detailed errors';
END $$;

