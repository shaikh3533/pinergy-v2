-- ================================================================
-- OPTIONAL: Add RLS Security Later (When Bookings Work)
-- Run this ONLY after bookings are working perfectly
-- ================================================================

-- This is OPTIONAL - Only use when you want to add security back

BEGIN;

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "users_all_access" ON users;
DROP POLICY IF EXISTS "bookings_all_access" ON bookings;

-- Simple policies that allow everything for now
CREATE POLICY "users_all_access"
  ON users FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "bookings_all_access"
  ON bookings FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

COMMIT;

-- Note: These are very permissive policies
-- They allow all operations by everyone
-- Good enough for MVP, can be tightened later


