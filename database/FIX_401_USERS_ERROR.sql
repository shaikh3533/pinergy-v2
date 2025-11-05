-- FIX: 401 Unauthorized error on users table
-- This happens when RLS policies are too restrictive

-- Step 1: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Step 2: Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;

-- Step 3: Create permissive policies

-- Allow authenticated users to read all user profiles (for leaderboard, etc.)
CREATE POLICY "users_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Allow public to read basic user info (for guest bookings)
CREATE POLICY "users_select_public"
  ON users FOR SELECT
  TO public
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to do everything
CREATE POLICY "users_admin_all"
  ON users FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Step 4: Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 5: Test query (should work now)
-- Run this as authenticated user:
-- SELECT * FROM users LIMIT 5;


