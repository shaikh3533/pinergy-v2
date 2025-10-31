-- Fix Authentication and RLS Issues
-- This script fixes the signup/signin flow for SPINERGY

-- 1. Drop existing RLS policies on users table
DROP POLICY IF EXISTS "Anyone can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can insert users as players" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- 2. Recreate users RLS policies with better permissions

-- Allow anyone to view all users (for leaderboard, ratings, etc.)
CREATE POLICY "Anyone can view all users"
  ON users FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile during signup
-- This policy allows users to create their profile when they sign up
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = id AND 
    role = 'player' AND 
    approved = true
  );

-- Allow users to update their own profile (but not change role)
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::uuid = id)
  WITH CHECK (
    auth.uid()::uuid = id AND 
    role = 'player' -- Prevent users from making themselves admin
  );

-- Allow admins to do everything
CREATE POLICY "Admins can do everything with users"
  ON users FOR ALL
  USING (is_admin(auth.uid()::uuid));

-- 3. Update bookings RLS to allow better access
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;

-- Allow users to view their own bookings OR if they're admin
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    user_id = auth.uid()::uuid OR 
    is_admin(auth.uid()::uuid)
  );

-- Allow authenticated users and guests to create bookings
CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true); -- Allow anyone to create bookings (even guests via the booking form)

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON bookings TO anon; -- Allow guest bookings
GRANT INSERT ON users TO authenticated; -- Allow user profile creation during signup
GRANT INSERT ON suggestions TO anon, authenticated; -- Allow anyone to submit feedback

-- 5. Allow anon to call necessary functions
GRANT EXECUTE ON FUNCTION increment_hours_played(UUID, FLOAT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon, authenticated;

-- Note: To disable email confirmation in Supabase:
-- Go to Authentication > Settings > Email Auth
-- Turn OFF "Enable email confirmations"
-- This allows users to sign in immediately without email verification

