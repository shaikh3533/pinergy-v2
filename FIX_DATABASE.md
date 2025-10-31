# 🔧 Fix Infinite Recursion Error

## Problem
You're seeing this error when signing up or booking:
```
"infinite recursion detected in policy for relation 'users'"
```

This happens because the Row Level Security (RLS) policies were checking the `users` table from within the `users` table policies, creating a circular reference.

## ✅ Solution

### Step 1: Go to Supabase Dashboard
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** from the left sidebar

### Step 2: Run the Fixed Schema

**Option A: Full Reset (Recommended if you don't have important data)**

1. Open the file `supabase-schema-fixed.sql` in this project
2. Copy **ALL** the contents
3. Paste into Supabase SQL Editor
4. Click **Run**

This will:
- Drop existing tables
- Recreate them with fixed policies
- Add sample data

**Option B: Update Only Policies (If you want to keep existing data)**

Run this SQL instead:

```sql
-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view all approved users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can insert users (for registration)" ON users;
DROP POLICY IF EXISTS "Admins can do everything with users" ON users;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Admins can manage matches" ON matches;
DROP POLICY IF EXISTS "Anyone can view ads" ON ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON ads;

-- Create helper function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create fixed policies for USERS table
CREATE POLICY "Users can view approved users and themselves"
  ON users FOR SELECT
  USING (approved = true OR id = auth.uid()::uuid);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid()::uuid)
  WITH CHECK (id = auth.uid()::uuid);

CREATE POLICY "Anyone can insert users (for registration)"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (is_admin(auth.uid()::uuid));

-- Create fixed policies for BOOKINGS table
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid()::uuid OR is_admin(auth.uid()::uuid));

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (user_id = auth.uid()::uuid OR is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  USING (is_admin(auth.uid()::uuid));

-- Create fixed policies for MATCHES table
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (
    player1_id = auth.uid()::uuid OR 
    player2_id = auth.uid()::uuid OR
    is_admin(auth.uid()::uuid)
  );

CREATE POLICY "Admins can manage matches"
  ON matches FOR ALL
  USING (is_admin(auth.uid()::uuid));

-- Create fixed policies for ADS table
CREATE POLICY "Anyone can view ads"
  ON ads FOR SELECT
  USING (true);

CREATE POLICY "Admins can create ads"
  ON ads FOR INSERT
  WITH CHECK (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can update ads"
  ON ads FOR UPDATE
  USING (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete ads"
  ON ads FOR DELETE
  USING (is_admin(auth.uid()::uuid));

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
```

### Step 3: Create Storage Buckets (If not done yet)

In Supabase Dashboard → Storage:
1. Create bucket: `profile_pics` (make it **Public**)
2. Create bucket: `match_videos` (make it **Public**)

### Step 4: Test the Fix

1. Go to your app: http://localhost:5173
2. Try to **Sign Up** with a new account
3. Try to **Book a Slot**

✅ The errors should be gone!

### Step 5: Create Admin User

After signing up, make yourself admin:

```sql
-- Replace with your actual email
UPDATE users 
SET role = 'admin', approved = true 
WHERE email = 'your-email@example.com';
```

## 🔍 What Was Fixed?

### The Problem
The old policies did this:
```sql
CREATE POLICY "Admins can do everything"
  USING (
    EXISTS (
      SELECT 1 FROM users  -- ❌ Checking users table FROM users table!
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### The Solution
The new approach uses a helper function with `SECURITY DEFINER`:
```sql
CREATE FUNCTION is_admin(user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- ✅ Bypasses RLS!
```

Then policies use: `USING (is_admin(auth.uid()::uuid))`

This breaks the recursion because `SECURITY DEFINER` runs with the function owner's privileges, bypassing RLS checks.

## 🎉 Done!

Your SmashZone app should now work perfectly without infinite recursion errors!

---

**Need help?** Check the main `SETUP_GUIDE.md` or `README.md`


